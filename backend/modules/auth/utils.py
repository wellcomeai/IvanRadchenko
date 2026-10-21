"""Хэширование паролей и JWT-токены."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import bcrypt
from anyio import to_thread
from jose import jwt

from config import settings

# bcrypt нарочно медленный (~0.3 с на хеш): считаем его в пуле потоков, иначе
# он блокирует event loop воркера и gunicorn убивает его по WORKER TIMEOUT.
# bcrypt отпускает GIL, поэтому другие запросы в это время обслуживаются.
BCRYPT_ROUNDS = 12


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(BCRYPT_ROUNDS)).decode()


def _verify(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except ValueError:  # битый или не-bcrypt хеш
        return False


async def hash_password(password: str) -> str:
    return await to_thread.run_sync(_hash, password)


async def verify_password(plain: str, hashed: str) -> bool:
    return await to_thread.run_sync(_verify, plain, hashed)


def _create_token(
    subject: str | UUID,
    token_type: str,
    expires_delta: timedelta,
    extra: dict[str, Any] | None = None,
) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(user_id: str | UUID) -> str:
    return _create_token(
        user_id,
        "access",
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(user_id: str | UUID) -> str:
    return _create_token(
        user_id,
        "refresh",
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
