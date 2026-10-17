"""Публичный адрес сайта для ссылок в письмах и реферальных ссылок.

Приоритет у `APP_URL` из ENV. Если он не задан, адрес берётся из заголовка `Host`
текущего запроса: так ссылки правильные сразу после первого деплоя, и не нужно
передеплоивать приложение, когда хостинг выдал технический домен.

`X-Forwarded-Host` намеренно не используется: его легко подделать и подсунуть
в письмо со сбросом пароля чужой домен. `Host` же проверяет сам хостинг, когда
маршрутизирует запрос к приложению.
"""
from __future__ import annotations

import re
from contextvars import ContextVar

from config import settings

_FALLBACK = "http://localhost:3000"
_HOST_RE = re.compile(r"^[A-Za-z0-9.-]+(:\d{1,5})?$")

_request_origin: ContextVar[str | None] = ContextVar("request_origin", default=None)


def _origin_from_host(host: str, scheme: str) -> str | None:
    if not _HOST_RE.match(host):
        return None
    # В production TLS завершается на балансировщике хостинга, а до контейнера
    # запрос доходит по http. Наружу сайт всегда открыт по https.
    if settings.environment.lower() == "production":
        scheme = "https"
    return f"{scheme}://{host}"


def app_url() -> str:
    """Базовый URL сайта без завершающего слеша."""
    if settings.app_url:
        return settings.app_url.rstrip("/")
    return _request_origin.get() or _FALLBACK


class RequestOriginMiddleware:
    """Запоминает адрес текущего запроса для `app_url()`.

    Чистый ASGI-middleware: значение видно и в обработчике, и в BackgroundTasks,
    которые Starlette выполняет после отправки ответа в рамках того же вызова.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        host = dict(scope.get("headers") or []).get(b"host", b"").decode("latin-1")
        origin = _origin_from_host(host, scope.get("scheme", "http")) if host else None
        token = _request_origin.set(origin)
        try:
            await self.app(scope, receive, send)
        finally:
            _request_origin.reset(token)
