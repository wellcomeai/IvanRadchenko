"""Бизнес-логика курса: модули, уроки, материалы."""
from __future__ import annotations

import os
import re
import uuid
from typing import Sequence
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from modules.course import storage
from modules.course.models import CourseModule, Lesson, LessonMaterial
from modules.course.schemas import (
    AdminModulePublic,
    LessonBrief,
    LessonCreate,
    LessonPublic,
    LessonUpdate,
    LessonView,
    MaterialPublic,
    ModulePublic,
    ModuleUpdate,
    ProgramModule,
    UploadedPart,
    UploadStart,
    UploadTicket,
)


# ---------- Загрузка из БД ----------


async def _modules_tree(db: AsyncSession) -> Sequence[CourseModule]:
    return (
        await db.scalars(
            select(CourseModule)
            .options(
                selectinload(CourseModule.lessons).selectinload(Lesson.materials)
            )
            .order_by(CourseModule.position)
        )
    ).all()


async def _get_module(db: AsyncSession, module_id: UUID) -> CourseModule:
    module = await db.get(CourseModule, module_id)
    if module is None:
        raise HTTPException(status_code=404, detail="Модуль не найден")
    return module


async def _get_lesson(db: AsyncSession, lesson_id: UUID) -> Lesson:
    lesson = await db.scalar(
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(selectinload(Lesson.materials), selectinload(Lesson.module))
    )
    if lesson is None:
        raise HTTPException(status_code=404, detail="Урок не найден")
    return lesson


async def _get_material(db: AsyncSession, material_id: UUID) -> LessonMaterial:
    material = await db.get(LessonMaterial, material_id)
    if material is None:
        raise HTTPException(status_code=404, detail="Материал не найден")
    return material


# ---------- Преобразование в схемы ----------


def _has_video(lesson: Lesson) -> bool:
    return any(m.kind == "video" and m.is_uploaded for m in lesson.materials)


def _brief(lesson: Lesson) -> LessonBrief:
    return LessonBrief(
        id=lesson.id,
        module_id=lesson.module_id,
        title=lesson.title,
        position=lesson.position,
        is_published=lesson.is_published,
        has_video=_has_video(lesson),
    )


def _material(m: LessonMaterial, with_url: bool) -> MaterialPublic:
    out = MaterialPublic.model_validate(m)
    if with_url and m.is_uploaded:
        out.url = storage.view_url(
            m.storage_key, m.filename, download=(m.kind == "file")
        )
    return out


def _lesson(lesson: Lesson, *, with_urls: bool, uploaded_only: bool) -> LessonPublic:
    materials = [
        _material(m, with_urls)
        for m in lesson.materials
        if m.is_uploaded or not uploaded_only
    ]
    return LessonPublic(
        **_brief(lesson).model_dump(),
        description=lesson.description,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at,
        materials=materials,
    )


# ---------- Ученик ----------


async def program(db: AsyncSession) -> list[ProgramModule]:
    """Программа курса для лендинга: модули и число опубликованных уроков."""
    counts = dict(
        (
            await db.execute(
                select(Lesson.module_id, func.count(Lesson.id))
                .where(Lesson.is_published.is_(True))
                .group_by(Lesson.module_id)
            )
        ).all()
    )
    modules = (
        await db.scalars(select(CourseModule).order_by(CourseModule.position))
    ).all()
    return [
        ProgramModule(
            position=m.position,
            title=m.title,
            description=m.description,
            lesson_count=counts.get(m.id, 0),
        )
        for m in modules
    ]


async def list_modules(db: AsyncSession, *, include_drafts: bool) -> list[ModulePublic]:
    """Модули с уроками для сайдбара. Черновики видит только админ."""
    return [
        ModulePublic(
            id=m.id,
            position=m.position,
            title=m.title,
            description=m.description,
            lessons=[
                _brief(lesson)
                for lesson in m.lessons
                if lesson.is_published or include_drafts
            ],
        )
        for m in await _modules_tree(db)
    ]


async def lesson_view(db: AsyncSession, lesson_id: UUID, *, is_admin: bool) -> LessonView:
    modules = await _modules_tree(db)
    ordered = [
        (m, lesson)
        for m in modules
        for lesson in m.lessons
        if lesson.is_published or is_admin
    ]
    idx = next((i for i, (_, l) in enumerate(ordered) if l.id == lesson_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Урок не найден")
    module, lesson = ordered[idx]
    base = _lesson(lesson, with_urls=True, uploaded_only=True)
    return LessonView(
        **base.model_dump(),
        module_title=module.title,
        module_position=module.position,
        prev_lesson_id=ordered[idx - 1][1].id if idx > 0 else None,
        next_lesson_id=ordered[idx + 1][1].id if idx + 1 < len(ordered) else None,
    )


# ---------- Админ: модули ----------


async def admin_list_modules(db: AsyncSession) -> list[AdminModulePublic]:
    return [
        AdminModulePublic(
            id=m.id,
            position=m.position,
            title=m.title,
            description=m.description,
            lessons=[
                _lesson(lesson, with_urls=False, uploaded_only=False)
                for lesson in m.lessons
            ],
        )
        for m in await _modules_tree(db)
    ]


async def update_module(db: AsyncSession, module_id: UUID, payload: ModuleUpdate) -> None:
    module = await _get_module(db, module_id)
    if payload.title is not None:
        module.title = payload.title.strip()
    if payload.description is not None:
        module.description = payload.description.strip()
    await db.commit()


# ---------- Админ: уроки ----------


async def _next_lesson_position(db: AsyncSession, module_id: UUID) -> int:
    current = await db.scalar(
        select(func.max(Lesson.position)).where(Lesson.module_id == module_id)
    )
    return (current or 0) + 1


async def admin_get_lesson(db: AsyncSession, lesson_id: UUID) -> LessonPublic:
    lesson = await _get_lesson(db, lesson_id)
    return _lesson(lesson, with_urls=True, uploaded_only=False)


async def create_lesson(db: AsyncSession, payload: LessonCreate) -> LessonPublic:
    await _get_module(db, payload.module_id)
    lesson = Lesson(
        module_id=payload.module_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        is_published=payload.is_published,
        position=await _next_lesson_position(db, payload.module_id),
    )
    db.add(lesson)
    await db.commit()
    return await admin_get_lesson(db, lesson.id)


async def update_lesson(
    db: AsyncSession, lesson_id: UUID, payload: LessonUpdate
) -> LessonPublic:
    lesson = await _get_lesson(db, lesson_id)
    if payload.module_id is not None and payload.module_id != lesson.module_id:
        await _get_module(db, payload.module_id)
        lesson.module_id = payload.module_id
        lesson.position = await _next_lesson_position(db, payload.module_id)
    if payload.title is not None:
        lesson.title = payload.title.strip()
    if payload.description is not None:
        lesson.description = payload.description.strip()
    if payload.is_published is not None:
        lesson.is_published = payload.is_published
    await db.commit()
    db.expire_all()
    return await admin_get_lesson(db, lesson_id)


async def delete_lesson(db: AsyncSession, lesson_id: UUID) -> None:
    lesson = await _get_lesson(db, lesson_id)
    files = [(m.storage_key, m.upload_id) for m in lesson.materials]
    await db.delete(lesson)
    await db.commit()
    for key, upload_id in files:
        await storage.delete(key, upload_id)


async def reorder_lessons(db: AsyncSession, lesson_ids: list[UUID]) -> None:
    """Новый порядок уроков одного модуля (список id сверху вниз)."""
    lessons = (
        await db.scalars(select(Lesson).where(Lesson.id.in_(lesson_ids)))
    ).all()
    if len(lessons) != len(set(lesson_ids)):
        raise HTTPException(status_code=404, detail="Урок не найден")
    module_ids = {lesson.module_id for lesson in lessons}
    if len(module_ids) != 1:
        raise HTTPException(status_code=400, detail="Уроки из разных модулей")
    in_module = await db.scalar(
        select(func.count(Lesson.id)).where(Lesson.module_id == module_ids.pop())
    )
    if in_module != len(lessons):
        raise HTTPException(status_code=400, detail="Нужен полный список уроков модуля")
    by_id = {lesson.id: lesson for lesson in lessons}
    for pos, lesson_id in enumerate(lesson_ids, start=1):
        by_id[lesson_id].position = pos
    await db.commit()


# ---------- Админ: материалы ----------


def _storage_key(lesson_id: UUID, filename: str) -> str:
    _, ext = os.path.splitext(filename)
    ext = re.sub(r"[^A-Za-z0-9.]", "", ext)[:16].lower()
    return f"lessons/{lesson_id}/{uuid.uuid4().hex}{ext}"


async def start_upload(
    db: AsyncSession, lesson_id: UUID, payload: UploadStart
) -> UploadTicket:
    storage.ensure_enabled()
    lesson = await _get_lesson(db, lesson_id)
    content_type = payload.content_type or "application/octet-stream"
    if payload.kind == "video" and not content_type.startswith("video/"):
        raise HTTPException(
            status_code=400, detail="Это не видеофайл. Загрузите видео, лучше в формате MP4"
        )

    key = _storage_key(lesson.id, payload.filename)
    started = await storage.start_multipart(key, content_type, payload.size_bytes)
    title = (payload.title or "").strip() or os.path.splitext(payload.filename)[0]
    material = LessonMaterial(
        lesson_id=lesson.id,
        kind=payload.kind,
        title=title[:255],
        filename=payload.filename,
        content_type=content_type,
        size_bytes=payload.size_bytes,
        storage_key=key,
        upload_id=started["upload_id"],
        is_uploaded=False,
        position=max((m.position for m in lesson.materials), default=0) + 1,
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return UploadTicket(
        material=_material(material, with_url=False),
        part_size=started["part_size"],
        part_urls=started["part_urls"],
    )


async def complete_upload(
    db: AsyncSession, material_id: UUID, parts: list[UploadedPart]
) -> MaterialPublic:
    material = await _get_material(db, material_id)
    if material.is_uploaded:
        return _material(material, with_url=True)
    if not material.upload_id:
        raise HTTPException(status_code=400, detail="Загрузка не начата")

    try:
        await storage.complete_multipart(
            material.storage_key,
            material.upload_id,
            [p.model_dump() for p in parts],
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 — показываем админу причину
        raise HTTPException(
            status_code=502, detail=f"Хранилище не приняло файл: {exc}"
        ) from exc

    size = await storage.head_size(material.storage_key)
    if size is None:
        raise HTTPException(status_code=502, detail="Файл не найден в хранилище")
    material.size_bytes = size
    material.upload_id = None
    material.is_uploaded = True
    await db.commit()
    await db.refresh(material)
    return _material(material, with_url=True)


async def update_material(
    db: AsyncSession, material_id: UUID, title: str
) -> MaterialPublic:
    material = await _get_material(db, material_id)
    material.title = title.strip()
    await db.commit()
    await db.refresh(material)
    return _material(material, with_url=True)


async def delete_material(db: AsyncSession, material_id: UUID) -> None:
    material = await _get_material(db, material_id)
    key, upload_id = material.storage_key, material.upload_id
    await db.delete(material)
    await db.commit()
    await storage.delete(key, upload_id)
