"""Продажа курса, доступ учеников и пошаговый прогресс.

Правила:
- Купить можно весь курс (CourseSettings.full_price) или модуль (CourseModule.price).
  Доступ действует CourseSettings.access_days дней (по умолчанию год).
- Модули покупаются по порядку: модуль N — только если раньше был доступ к N-1.
- Первый опубликованный урок первого модуля бесплатный.
- Уроки открываются по одному: следующий — после «Урок пройден» на предыдущем,
  в том числе через границу модулей (модуль 2 начинается после всего модуля 1).
- Админ видит всё без ограничений и может выдать доступ вручную.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Sequence
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import settings
from modules.auth.models import User, UserRole
from modules.billing import robokassa
from modules.billing.models import Payment, PaymentProvider, PaymentStatus
from modules.course.models import (
    CourseAccess,
    CourseModule,
    CourseSettings,
    Lesson,
    LessonProgress,
)
from modules.course.schemas import (
    AccessGrant,
    AccessPublic,
    CourseSettingsUpdate,
    LessonStatus,
    PublicPricing,
    Shop,
    ShopFullCourse,
    ShopModule,
    StudentDetail,
    StudentLesson,
    StudentModule,
    StudentRow,
)

# Продлить доступ можно, когда до конца осталось не больше стольких дней.
RENEW_WINDOW_DAYS = 30


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------- Загрузка ----------


async def get_settings(db: AsyncSession) -> CourseSettings:
    row = await db.get(CourseSettings, 1)
    if row is None:  # миграция создаёт строку; на всякий случай
        row = CourseSettings(id=1, full_price=Decimal(25800), access_days=365)
        db.add(row)
        await db.flush()
    return row


async def _modules(db: AsyncSession) -> Sequence[CourseModule]:
    return (
        await db.scalars(
            select(CourseModule)
            .options(selectinload(CourseModule.lessons).selectinload(Lesson.materials))
            .order_by(CourseModule.position)
        )
    ).all()


async def _accesses(db: AsyncSession, user_id: UUID) -> Sequence[CourseAccess]:
    return (
        await db.scalars(
            select(CourseAccess)
            .where(CourseAccess.user_id == user_id)
            .order_by(CourseAccess.created_at)
        )
    ).all()


async def _progress(db: AsyncSession, user_id: UUID) -> dict[UUID, LessonProgress]:
    rows = (
        await db.scalars(select(LessonProgress).where(LessonProgress.user_id == user_id))
    ).all()
    return {p.lesson_id: p for p in rows}


def _is_active(a: CourseAccess, now: datetime) -> bool:
    return a.revoked_at is None and a.starts_at <= now < a.expires_at


def _published(m: CourseModule) -> list[Lesson]:
    return [lesson for lesson in m.lessons if lesson.is_published]


# ---------- Состояние ученика ----------


@dataclass
class CourseState:
    """Всё, что нужно знать о доступе одного ученика."""

    modules: Sequence[CourseModule]
    full_until: datetime | None
    # Конец доступа к модулю (учитывает и полный курс). Нет ключа — не оплачен.
    module_until: dict[UUID, datetime]
    # Модули, к которым когда-либо был доступ (для покупки по порядку).
    ever_modules: set[UUID]
    ever_full: bool
    lesson_status: dict[UUID, LessonStatus] = field(default_factory=dict)
    # Уроки в порядке прохождения (только опубликованные; для админа — все).
    ordered: list[tuple[CourseModule, Lesson]] = field(default_factory=list)
    free_lesson_id: UUID | None = None
    progress: dict[UUID, LessonProgress] = field(default_factory=dict)


def _compute(
    modules: Sequence[CourseModule],
    accesses: Sequence[CourseAccess],
    progress: dict[UUID, LessonProgress],
    *,
    is_admin: bool,
    now: datetime,
) -> CourseState:
    active = [a for a in accesses if _is_active(a, now)]
    # Активный доступ может продолжаться следующим (продление) — берём самый поздний конец.
    def until(match) -> datetime | None:
        ends = [a.expires_at for a in accesses if a.revoked_at is None and match(a)]
        if not any(match(a) for a in active):
            return None
        return max(ends)

    full_until = until(lambda a: a.module_id is None)
    module_until: dict[UUID, datetime] = {}
    for m in modules:
        own = until(lambda a, mid=m.id: a.module_id == mid)
        ends = [d for d in (full_until, own) if d is not None]
        if ends:
            module_until[m.id] = max(ends)

    valid = [a for a in accesses if a.revoked_at is None]
    state = CourseState(
        modules=modules,
        full_until=full_until,
        module_until=module_until,
        ever_modules={a.module_id for a in valid if a.module_id is not None},
        ever_full=any(a.module_id is None for a in valid),
        progress=progress,
    )

    for m in modules:
        lessons = m.lessons if is_admin else _published(m)
        for lesson in lessons:
            state.ordered.append((m, lesson))
    published = [(m, l) for m, l in state.ordered if l.is_published]
    if published:
        state.free_lesson_id = published[0][1].id

    all_prev_done = True
    for m, lesson in state.ordered:
        done = bool(progress.get(lesson.id) and progress[lesson.id].completed_at)
        if is_admin:
            status: LessonStatus = "completed" if done else "available"
        else:
            paid = m.id in module_until or lesson.id == state.free_lesson_id
            if not paid:
                status = "locked_payment"
            elif done:
                status = "completed"
            elif all_prev_done:
                status = "available"
            else:
                status = "locked_sequence"
            all_prev_done = all_prev_done and done
        state.lesson_status[lesson.id] = status
    return state


async def course_state(db: AsyncSession, user: User) -> CourseState:
    return _compute(
        await _modules(db),
        await _accesses(db, user.id),
        await _progress(db, user.id),
        is_admin=user.role == UserRole.ADMIN,
        now=_now(),
    )


def lesson_gate(state: CourseState, lesson_id: UUID) -> LessonStatus:
    """Статус урока или 404; при закрытом уроке — 403 с кодом причины."""
    status = state.lesson_status.get(lesson_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Урок не найден")
    if status == "locked_payment":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "locked_payment",
                "message": "Этот модуль ещё не оплачен",
            },
        )
    if status == "locked_sequence":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "locked_sequence",
                "message": "Сначала пройдите предыдущие уроки",
            },
        )
    return status


async def mark_opened(db: AsyncSession, user: User, lesson_id: UUID) -> LessonProgress | None:
    """Запомнить, что ученик открыл урок (админа не считаем)."""
    if user.role == UserRole.ADMIN:
        return None
    now = _now()
    row = await db.scalar(
        select(LessonProgress).where(
            LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson_id
        )
    )
    if row is None:
        row = LessonProgress(
            user_id=user.id, lesson_id=lesson_id, first_opened_at=now, last_opened_at=now
        )
        db.add(row)
    else:
        row.last_opened_at = now
    await db.commit()
    return row


async def complete_lesson(db: AsyncSession, user: User, lesson_id: UUID):
    state = await course_state(db, user)
    lesson_gate(state, lesson_id)
    now = _now()
    row = state.progress.get(lesson_id)
    if row is None:
        row = LessonProgress(
            user_id=user.id, lesson_id=lesson_id, first_opened_at=now, last_opened_at=now
        )
        db.add(row)
    if row.completed_at is None:
        row.completed_at = now
    completed_at = row.completed_at
    await db.commit()

    # Пересчитать, что открылось дальше.
    state = await course_state(db, user)
    ids = [lesson.id for _, lesson in state.ordered]
    idx = ids.index(lesson_id)
    next_id = ids[idx + 1] if idx + 1 < len(ids) else None
    return completed_at, next_id, state.lesson_status.get(next_id) if next_id else None


# ---------- Магазин ----------


def _shop_modules(state: CourseState) -> list[ShopModule]:
    now = _now()
    out: list[ShopModule] = []
    prev_id: UUID | None = None
    for m in state.modules:
        until = state.module_until.get(m.id)
        blocked = None
        if state.full_until is not None and state.full_until - now > timedelta(days=RENEW_WINDOW_DAYS):
            blocked = "included_in_course"
        elif until is not None and until - now > timedelta(days=RENEW_WINDOW_DAYS):
            blocked = "owned"
        elif prev_id is not None and not (
            state.ever_full or prev_id in state.ever_modules
        ):
            blocked = "need_previous"
        out.append(
            ShopModule(
                id=m.id,
                position=m.position,
                title=m.title,
                price=m.price,
                access_until=until,
                can_buy=blocked is None,
                blocked_by=blocked,
            )
        )
        prev_id = m.id
    return out


async def shop(db: AsyncSession, user: User) -> Shop:
    cfg = await get_settings(db)
    state = await course_state(db, user)
    now = _now()
    full_can_buy = state.full_until is None or state.full_until - now <= timedelta(
        days=RENEW_WINDOW_DAYS
    )
    return Shop(
        access_days=cfg.access_days,
        full_course=ShopFullCourse(
            price=cfg.full_price, access_until=state.full_until, can_buy=full_can_buy
        ),
        modules=_shop_modules(state),
    )


async def public_pricing(db: AsyncSession) -> PublicPricing:
    cfg = await get_settings(db)
    modules = (await db.scalars(select(CourseModule).order_by(CourseModule.position))).all()
    return PublicPricing(
        full_price=cfg.full_price,
        access_days=cfg.access_days,
        modules=[
            ShopModule(id=m.id, position=m.position, title=m.title, price=m.price, can_buy=True)
            for m in modules
        ],
    )


async def create_checkout(
    db: AsyncSession, user: User, product: str, module_id: UUID | None
) -> tuple[str, Payment]:
    cfg = await get_settings(db)
    current = await shop(db, user)
    if product == "course":
        if not current.full_course.can_buy:
            raise HTTPException(status_code=400, detail="Курс уже оплачен")
        amount = cfg.full_price
        meta = {"product": "course", "access_days": cfg.access_days}
        description = f"{settings.app_name}: весь курс на {cfg.access_days} дн."
        item = f"Доступ к онлайн-курсу «{settings.app_name}» на {cfg.access_days} дн."
    else:
        item_mod = next((m for m in current.modules if m.id == module_id), None)
        if item_mod is None:
            raise HTTPException(status_code=404, detail="Модуль не найден")
        if not item_mod.can_buy:
            reasons = {
                "owned": "Модуль уже оплачен",
                "included_in_course": "Модуль уже входит в оплаченный курс",
                "need_previous": "Сначала оплатите предыдущий модуль",
            }
            raise HTTPException(
                status_code=400, detail=reasons.get(item_mod.blocked_by or "", "Нельзя купить")
            )
        amount = item_mod.price
        meta = {
            "product": "module",
            "module_id": str(item_mod.id),
            "module_position": item_mod.position,
            "access_days": cfg.access_days,
        }
        description = f"{settings.app_name}: модуль {item_mod.position} «{item_mod.title}»"
        item = (
            f"Доступ к модулю {item_mod.position} «{item_mod.title}» онлайн-курса "
            f"«{settings.app_name}» на {cfg.access_days} дн."
        )

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Цена не задана")

    inv_id = str(int(time.time() * 1000))
    payment = Payment(
        user_id=user.id,
        amount=amount,
        currency="RUB",
        status=PaymentStatus.PENDING,
        provider=PaymentProvider.ROBOKASSA,
        provider_payment_id=inv_id,
        payment_metadata=meta,
    )
    db.add(payment)
    await db.flush()
    url = robokassa.build_payment_url(
        inv_id=inv_id,
        amount=amount,
        description=description[:100],
        user_email=user.email,
        receipt_item=item,
    )
    await db.commit()
    await db.refresh(payment)
    return url, payment


def is_course_payment(payment: Payment) -> bool:
    return (payment.payment_metadata or {}).get("product") in ("course", "module")


async def _grant(
    db: AsyncSession,
    user_id: UUID,
    module_id: UUID | None,
    days: int,
    source: str,
    payment_id: UUID | None = None,
) -> CourseAccess:
    """Выдать доступ. Если такой же доступ ещё действует — новый начнётся после него."""
    now = _now()
    current_end = await db.scalar(
        select(func.max(CourseAccess.expires_at)).where(
            CourseAccess.user_id == user_id,
            CourseAccess.revoked_at.is_(None),
            CourseAccess.expires_at > now,
            CourseAccess.module_id.is_(None)
            if module_id is None
            else CourseAccess.module_id == module_id,
        )
    )
    start = max(now, current_end) if current_end else now
    access = CourseAccess(
        user_id=user_id,
        module_id=module_id,
        starts_at=start,
        expires_at=start + timedelta(days=days),
        source=source,
        payment_id=payment_id,
    )
    db.add(access)
    await db.flush()
    return access


async def activate_payment(db: AsyncSession, payment: Payment) -> CourseAccess:
    """Вызывается из webhook Робокассы после проверки подписи."""
    existing = await db.scalar(
        select(CourseAccess).where(CourseAccess.payment_id == payment.id)
    )
    if existing is not None:
        return existing
    meta = payment.payment_metadata or {}
    days = int(meta.get("access_days") or (await get_settings(db)).access_days)
    module_id = UUID(meta["module_id"]) if meta.get("product") == "module" else None
    return await _grant(db, payment.user_id, module_id, days, "payment", payment.id)


# ---------- Админ ----------


async def update_settings(db: AsyncSession, payload: CourseSettingsUpdate) -> CourseSettings:
    cfg = await get_settings(db)
    if payload.full_price is not None:
        cfg.full_price = payload.full_price
    if payload.access_days is not None:
        cfg.access_days = payload.access_days
    await db.commit()
    await db.refresh(cfg)
    return cfg


async def admin_grant(db: AsyncSession, payload: AccessGrant) -> CourseAccess:
    if await db.get(User, payload.user_id) is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if payload.module_id is not None and await db.get(CourseModule, payload.module_id) is None:
        raise HTTPException(status_code=404, detail="Модуль не найден")
    days = payload.days or (await get_settings(db)).access_days
    access = await _grant(db, payload.user_id, payload.module_id, days, "admin")
    await db.commit()
    return access


async def admin_revoke(db: AsyncSession, access_id: UUID) -> None:
    access = await db.get(CourseAccess, access_id)
    if access is None:
        raise HTTPException(status_code=404, detail="Доступ не найден")
    if access.revoked_at is None:
        access.revoked_at = _now()
        await db.commit()


def _name(user: User) -> str | None:
    p = user.profile
    if p is None:
        return None
    name = " ".join(x for x in (p.first_name, p.last_name) if x)
    return name or None


def _row(
    user: User,
    state: CourseState,
    lesson_titles: dict[UUID, str],
    total_lessons: int,
) -> StudentRow:
    progress = state.progress.values()
    completed = sum(
        1 for p in progress if p.completed_at and p.lesson_id in lesson_titles
    )
    last = max(progress, key=lambda p: p.last_opened_at, default=None)
    activity = [p.last_opened_at for p in progress] + [
        p.completed_at for p in progress if p.completed_at
    ]
    paid_modules = [
        m.position
        for m in state.modules
        if m.id in state.module_until and state.full_until is None
    ]
    return StudentRow(
        id=user.id,
        email=user.email,
        name=_name(user),
        created_at=user.created_at,
        full_course_until=state.full_until,
        modules_paid=paid_modules,
        completed_lessons=completed,
        total_lessons=total_lessons,
        last_lesson_title=lesson_titles.get(last.lesson_id) if last else None,
        last_activity_at=max(activity) if activity else None,
    )


async def admin_students(
    db: AsyncSession, *, search: str | None, page: int, limit: int
) -> list[StudentRow]:
    q = (
        select(User)
        .options(selectinload(User.profile))
        .where(User.role == UserRole.USER)
        .order_by(User.created_at.desc())
    )
    if search:
        q = q.where(User.email.ilike(f"%{search.strip()}%"))
    users = (await db.scalars(q.limit(limit).offset((page - 1) * limit))).all()
    if not users:
        return []

    modules = await _modules(db)
    lesson_titles = {l.id: l.title for m in modules for l in _published(m)}
    ids = [u.id for u in users]
    accesses = (
        await db.scalars(select(CourseAccess).where(CourseAccess.user_id.in_(ids)))
    ).all()
    progress = (
        await db.scalars(select(LessonProgress).where(LessonProgress.user_id.in_(ids)))
    ).all()
    now = _now()
    rows = []
    for u in users:
        state = _compute(
            modules,
            [a for a in accesses if a.user_id == u.id],
            {p.lesson_id: p for p in progress if p.user_id == u.id},
            is_admin=False,
            now=now,
        )
        rows.append(_row(u, state, lesson_titles, len(lesson_titles)))
    return rows


async def admin_student(db: AsyncSession, user_id: UUID) -> StudentDetail:
    user = await db.scalar(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    modules = await _modules(db)
    accesses = await _accesses(db, user.id)
    state = _compute(modules, accesses, await _progress(db, user.id), is_admin=False, now=_now())
    lesson_titles = {l.id: l.title for m in modules for l in _published(m)}
    positions = {m.id: m.position for m in modules}
    now = _now()

    return StudentDetail(
        row=_row(user, state, lesson_titles, len(lesson_titles)),
        accesses=[
            AccessPublic(
                id=a.id,
                module_id=a.module_id,
                module_position=positions.get(a.module_id) if a.module_id else None,
                starts_at=a.starts_at,
                expires_at=a.expires_at,
                source=a.source,
                revoked_at=a.revoked_at,
                is_active=_is_active(a, now),
            )
            for a in reversed(accesses)
        ],
        modules=[
            StudentModule(
                id=m.id,
                position=m.position,
                title=m.title,
                access_until=state.module_until.get(m.id),
                lessons=[
                    StudentLesson(
                        id=l.id,
                        title=l.title,
                        position=l.position,
                        status=state.lesson_status[l.id],
                        first_opened_at=getattr(state.progress.get(l.id), "first_opened_at", None),
                        last_opened_at=getattr(state.progress.get(l.id), "last_opened_at", None),
                        completed_at=getattr(state.progress.get(l.id), "completed_at", None),
                    )
                    for l in _published(m)
                ],
            )
            for m in modules
        ],
    )
