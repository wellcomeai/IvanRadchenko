"""Async SQLAlchemy engine, session factory и Base.

В моделях используется `from database import Base`.
В роутерах — `db: AsyncSession = Depends(get_db)`.
"""

from __future__ import annotations

import ssl
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from config import settings


class Base(DeclarativeBase):
    """Базовый класс для всех ORM моделей."""


# SSL context для asyncpg (управляемая PostgreSQL Timeweb)
# Нужен чтобы asyncpg не пытался читать
# системные SSL сертификаты из /root/.postgresql/
ssl_ctx = ssl.create_default_context()

# Workaround для managed PostgreSQL
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE


engine = create_async_engine(
    settings.database_url,
    echo=(settings.environment == "development"),
    pool_pre_ping=True,
    # Явный размер пула: по умолчанию до 15 соединений на каждый воркер gunicorn.
    pool_size=5,
    max_overflow=5,
    pool_timeout=10,
    pool_recycle=1800,
    connect_args={
        "ssl": ssl_ctx,
        "timeout": 10,
        "command_timeout": 30,
    },
)


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: даёт сессию на время запроса."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
