"""Курс: просмотр для учеников и управление для админа."""
from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from dependencies import CurrentUser, require_admin
from modules.course import service
from modules.course.schemas import (
    AdminModulePublic,
    LessonCreate,
    LessonPublic,
    LessonReorder,
    LessonUpdate,
    LessonView,
    MaterialPublic,
    MaterialUpdate,
    ModulePublic,
    ModuleUpdate,
    ProgramModule,
    StorageStatus,
    UploadComplete,
    UploadStart,
    UploadTicket,
)

Db = Annotated[AsyncSession, Depends(get_db)]

router = APIRouter(prefix="/course", tags=["course"])


@router.get("/program", response_model=list[ProgramModule])
async def program(db: Db):
    """Программа курса для лендинга — без входа."""
    return await service.program(db)


@router.get("/modules", response_model=list[ModulePublic])
async def list_modules(user: CurrentUser, db: Db):
    return await service.list_modules(db, include_drafts=user.role == "admin")


@router.get("/lessons/{lesson_id}", response_model=LessonView)
async def get_lesson(lesson_id: UUID, user: CurrentUser, db: Db):
    return await service.lesson_view(db, lesson_id, is_admin=user.role == "admin")


admin_router = APIRouter(
    prefix="/admin/course",
    tags=["admin-course"],
    dependencies=[Depends(require_admin)],
)


@admin_router.get("/storage", response_model=StorageStatus)
async def storage_status():
    return StorageStatus(
        enabled=settings.storage_enabled,
        bucket=settings.s3_bucket or None,
    )


@admin_router.get("/modules", response_model=list[AdminModulePublic])
async def admin_modules(db: Db):
    return await service.admin_list_modules(db)


@admin_router.patch("/modules/{module_id}", status_code=204)
async def update_module(module_id: UUID, payload: ModuleUpdate, db: Db):
    await service.update_module(db, module_id, payload)


@admin_router.post("/lessons", response_model=LessonPublic, status_code=201)
async def create_lesson(payload: LessonCreate, db: Db):
    return await service.create_lesson(db, payload)


@admin_router.put("/lessons/order", status_code=204)
async def reorder_lessons(payload: LessonReorder, db: Db):
    await service.reorder_lessons(db, payload.lesson_ids)


@admin_router.get("/lessons/{lesson_id}", response_model=LessonPublic)
async def admin_lesson(lesson_id: UUID, db: Db):
    return await service.admin_get_lesson(db, lesson_id)


@admin_router.patch("/lessons/{lesson_id}", response_model=LessonPublic)
async def update_lesson(lesson_id: UUID, payload: LessonUpdate, db: Db):
    return await service.update_lesson(db, lesson_id, payload)


@admin_router.delete("/lessons/{lesson_id}", status_code=204)
async def delete_lesson(lesson_id: UUID, db: Db):
    await service.delete_lesson(db, lesson_id)


@admin_router.post(
    "/lessons/{lesson_id}/uploads", response_model=UploadTicket, status_code=201
)
async def start_upload(lesson_id: UUID, payload: UploadStart, db: Db):
    """Начать загрузку файла: браузер получит ссылки и сам отправит части в S3."""
    return await service.start_upload(db, lesson_id, payload)


@admin_router.post("/materials/{material_id}/complete", response_model=MaterialPublic)
async def complete_upload(material_id: UUID, payload: UploadComplete, db: Db):
    return await service.complete_upload(db, material_id, payload.parts)


@admin_router.patch("/materials/{material_id}", response_model=MaterialPublic)
async def update_material(material_id: UUID, payload: MaterialUpdate, db: Db):
    return await service.update_material(db, material_id, payload.title)


@admin_router.delete("/materials/{material_id}", status_code=204)
async def delete_material(material_id: UUID, db: Db):
    await service.delete_material(db, material_id)
