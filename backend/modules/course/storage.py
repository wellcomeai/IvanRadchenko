"""S3-хранилище материалов курса (Timeweb Cloud S3 или любое S3-совместимое).

Файлы не проходят через сервер: браузер админа грузит их прямо в S3 по
подписанным ссылкам (multipart, частями), а ученик смотрит видео по
временной подписанной ссылке. Бакет приватный.

boto3 синхронный — сетевые вызовы оборачиваем в run_in_threadpool.
Подпись ссылок (generate_presigned_url) считается локально, без сети.
"""
from __future__ import annotations

import logging
import math
from functools import lru_cache

from fastapi import HTTPException
from starlette.concurrency import run_in_threadpool

from config import settings

logger = logging.getLogger("opensaas.course.storage")

MIN_PART_SIZE = 16 * 1024 * 1024  # 16 МБ
MAX_PARTS = 10_000  # ограничение S3
UPLOAD_URL_TTL = 24 * 3600  # ссылки на загрузку частей живут сутки
VIEW_URL_TTL = 6 * 3600  # ссылка на просмотр видео — 6 часов


def ensure_enabled() -> None:
    if not settings.storage_enabled:
        raise HTTPException(
            status_code=503,
            detail="Хранилище файлов не подключено: задайте S3_BUCKET, S3_ACCESS_KEY и S3_SECRET_KEY",
        )


@lru_cache
def _client():
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        # boto3 закреплён на 1.35.x: с 1.36 он по умолчанию шлёт новые
        # контрольные суммы, которые S3-совместимые хранилища понимают не всегда.
        # Короткие таймауты: по умолчанию у boto3 60 с на соединение и чтение
        # и до 5 попыток, и один зависший запрос держит поток минутами.
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            connect_timeout=5,
            read_timeout=20,
            retries={"max_attempts": 2, "mode": "standard"},
        ),
    )


def part_size_for(size_bytes: int) -> int:
    return max(MIN_PART_SIZE, math.ceil(size_bytes / MAX_PARTS))


async def start_multipart(key: str, content_type: str, size_bytes: int) -> dict:
    """Начать multipart-загрузку и подписать ссылки на все части."""
    ensure_enabled()
    client = _client()
    resp = await run_in_threadpool(
        client.create_multipart_upload,
        Bucket=settings.s3_bucket,
        Key=key,
        ContentType=content_type,
    )
    upload_id = resp["UploadId"]
    part_size = part_size_for(size_bytes)
    part_count = max(1, math.ceil(size_bytes / part_size))
    urls = [
        client.generate_presigned_url(
            "upload_part",
            Params={
                "Bucket": settings.s3_bucket,
                "Key": key,
                "UploadId": upload_id,
                "PartNumber": n,
            },
            ExpiresIn=UPLOAD_URL_TTL,
        )
        for n in range(1, part_count + 1)
    ]
    return {"upload_id": upload_id, "part_size": part_size, "part_urls": urls}


async def complete_multipart(key: str, upload_id: str, parts: list[dict]) -> None:
    ensure_enabled()
    await run_in_threadpool(
        _client().complete_multipart_upload,
        Bucket=settings.s3_bucket,
        Key=key,
        UploadId=upload_id,
        MultipartUpload={
            "Parts": [
                {"PartNumber": p["part_number"], "ETag": p["etag"]}
                for p in sorted(parts, key=lambda p: p["part_number"])
            ]
        },
    )


async def head_size(key: str) -> int | None:
    """Размер объекта в S3 или None, если его нет."""
    from botocore.exceptions import ClientError

    try:
        resp = await run_in_threadpool(
            _client().head_object, Bucket=settings.s3_bucket, Key=key
        )
    except ClientError:
        return None
    return int(resp.get("ContentLength", 0))


async def delete(key: str, upload_id: str | None = None) -> None:
    """Удалить объект (или прервать незавершённую загрузку). Ошибки — в лог."""
    if not settings.storage_enabled:
        return
    client = _client()
    try:
        if upload_id:
            await run_in_threadpool(
                client.abort_multipart_upload,
                Bucket=settings.s3_bucket,
                Key=key,
                UploadId=upload_id,
            )
        await run_in_threadpool(
            client.delete_object, Bucket=settings.s3_bucket, Key=key
        )
    except Exception:  # noqa: BLE001 — запись в БД всё равно удаляем
        logger.exception("Не удалось удалить %s из S3", key)


def view_url(key: str, filename: str, download: bool = False) -> str | None:
    if not settings.storage_enabled:
        return None
    from urllib.parse import quote

    disposition = "attachment" if download else "inline"
    return _client().generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.s3_bucket,
            "Key": key,
            "ResponseContentDisposition": (
                f"{disposition}; filename*=UTF-8''{quote(filename)}"
            ),
        },
        ExpiresIn=VIEW_URL_TTL,
    )


def ensure_cors() -> None:
    """Разрешить браузеру грузить файлы в бакет и читать ETag частей.

    Ссылки подписаны и сами по себе дают доступ, поэтому источник — любой.
    Вызывается из start.sh до запуска gunicorn; ошибка не мешает запуску.
    """
    if not settings.storage_enabled:
        return
    try:
        _client().put_bucket_cors(
            Bucket=settings.s3_bucket,
            CORSConfiguration={
                "CORSRules": [
                    {
                        "AllowedOrigins": ["*"],
                        "AllowedMethods": ["GET", "PUT", "HEAD"],
                        "AllowedHeaders": ["*"],
                        "ExposeHeaders": ["ETag"],
                        "MaxAgeSeconds": 3600,
                    }
                ]
            },
        )
        logger.info("S3: CORS для бакета %s настроен", settings.s3_bucket)
    except Exception:  # noqa: BLE001
        logger.exception("S3: не удалось настроить CORS для бакета %s", settings.s3_bucket)
