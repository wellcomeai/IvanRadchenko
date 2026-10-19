from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

MaterialKind = Literal["video", "file"]


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


# ---------- Модули ----------


class ModuleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10_000)


class ModulePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    position: int
    title: str
    description: str
    lessons: list[LessonBrief] = []


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
