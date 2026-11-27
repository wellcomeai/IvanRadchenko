from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

MaterialKind = Literal["video", "file"]
# Состояние урока для ученика:
# completed — пройден; available — открыт; locked_sequence — сначала пройти предыдущие;
# locked_payment — модуль не оплачен.
LessonStatus = Literal["completed", "available", "locked_sequence", "locked_payment"]


# ---------- Материалы ----------


class MaterialPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    kind: MaterialKind
    title: str
    filename: str
    content_type: str
    size_bytes: int
    is_uploaded: bool
    position: int
    created_at: datetime
    # Временная ссылка на просмотр/скачивание (только для загруженных).
    url: str | None = None


class UploadStart(BaseModel):
    kind: MaterialKind
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(default="application/octet-stream", max_length=127)
    size_bytes: int = Field(gt=0, le=50 * 1024**3)  # до 50 ГБ
    title: str | None = Field(default=None, max_length=255)


class UploadTicket(BaseModel):
    material: MaterialPublic
    part_size: int
    part_urls: list[str]


class UploadedPart(BaseModel):
    part_number: int = Field(ge=1, le=10_000)
    etag: str = Field(min_length=1, max_length=255)


class UploadComplete(BaseModel):
    parts: list[UploadedPart] = Field(min_length=1)


class MaterialUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


# ---------- Уроки ----------


class LessonCreate(BaseModel):
    module_id: UUID
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=50_000)
    is_published: bool = False


class LessonUpdate(BaseModel):
    module_id: UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=50_000)
    is_published: bool | None = None


class LessonReorder(BaseModel):
    lesson_ids: list[UUID] = Field(min_length=1)


class LessonBrief(BaseModel):
    """Строка урока в сайдбаре и списках."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    module_id: UUID
    title: str
    position: int
    is_published: bool
    has_video: bool = False
    # Для ученика (у админа всегда available/completed).
    status: LessonStatus = "available"
    is_free: bool = False


class LessonPublic(LessonBrief):
    description: str
    created_at: datetime
    updated_at: datetime
    materials: list[MaterialPublic] = []


class LessonView(LessonPublic):
    """Страница урока для ученика: + модуль и соседние уроки."""

    module_title: str
    module_position: int
    prev_lesson_id: UUID | None = None
    next_lesson_id: UUID | None = None
    completed_at: datetime | None = None


class LessonCompleteResult(BaseModel):
    completed_at: datetime
    next_lesson_id: UUID | None = None
    next_lesson_status: LessonStatus | None = None


# ---------- Модули ----------


class ModuleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10_000)
    price: Decimal | None = Field(default=None, ge=1, le=10_000_000)


class ModulePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    position: int
    title: str
    description: str
    price: Decimal = Decimal(0)
    lessons: list[LessonBrief] = []
    # Для ученика: до какого числа модуль доступен (None — не оплачен).
    access_until: datetime | None = None
    completed_count: int = 0


class AdminModulePublic(ModulePublic):
    lessons: list[LessonPublic] = []  # type: ignore[assignment]


class ProgramModule(BaseModel):
    """Программа курса для лендинга (без входа)."""

    position: int
    title: str
    description: str
    lesson_count: int


class StorageStatus(BaseModel):
    enabled: bool
    bucket: str | None = None


# ---------- Продажа и доступ ----------

BuyBlock = Literal["owned", "need_previous", "included_in_course"]


class ShopModule(BaseModel):
    id: UUID
    position: int
    title: str
    price: Decimal
    access_until: datetime | None = None
    can_buy: bool
    # Почему нельзя купить: уже оплачен / сначала предыдущий / уже входит в курс.
    blocked_by: BuyBlock | None = None


class ShopFullCourse(BaseModel):
    price: Decimal
    access_until: datetime | None = None
    can_buy: bool


class Shop(BaseModel):
    """Что ученик может купить и что у него уже есть."""

    access_days: int
    full_course: ShopFullCourse
    modules: list[ShopModule]


class PublicPricing(BaseModel):
    """Цены для оферты и лендинга (без входа)."""

    full_price: Decimal
    access_days: int
    modules: list[ShopModule]


class CheckoutRequest(BaseModel):
    product: Literal["course", "module"]
    module_id: UUID | None = None


class CheckoutResponse(BaseModel):
    payment_url: str
    payment_id: UUID


class CourseSettingsPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_price: Decimal
    access_days: int


class CourseSettingsUpdate(BaseModel):
    full_price: Decimal | None = Field(default=None, ge=1, le=10_000_000)
    access_days: int | None = Field(default=None, ge=1, le=3650)


# ---------- Админ: ученики ----------


class AccessPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    module_id: UUID | None = None
    module_position: int | None = None
    starts_at: datetime
    expires_at: datetime
    source: str
    revoked_at: datetime | None = None
    is_active: bool = False


class AccessGrant(BaseModel):
    user_id: UUID
    module_id: UUID | None = None  # None — весь курс
    days: int | None = Field(default=None, ge=1, le=3650)


class StudentRow(BaseModel):
    id: UUID
    email: str
    name: str | None = None
    created_at: datetime
    full_course_until: datetime | None = None
    # Номера модулей с активным доступом (без учёта полного курса).
    modules_paid: list[int] = []
    completed_lessons: int
    total_lessons: int
    last_lesson_title: str | None = None
    last_activity_at: datetime | None = None


class StudentLesson(BaseModel):
    id: UUID
    title: str
    position: int
    status: LessonStatus
    first_opened_at: datetime | None = None
    last_opened_at: datetime | None = None
    completed_at: datetime | None = None


class StudentModule(BaseModel):
    id: UUID
    position: int
    title: str
    access_until: datetime | None = None
    lessons: list[StudentLesson]


class StudentDetail(BaseModel):
    row: StudentRow
    accesses: list[AccessPublic]
    modules: list[StudentModule]
