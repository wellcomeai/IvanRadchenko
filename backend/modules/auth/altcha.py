"""ALTCHA: защита форм от ботов без внешних сервисов и ключей.

Протокол совместим с https://altcha.org (proof-of-work):
1. Сервер выдаёт задачу: salt, challenge = sha256(salt + number) и HMAC-подпись.
2. Браузер перебирает number от 0 до maxnumber, пока хеш не совпадёт (~0.5 с).
3. Форма отправляет base64(JSON) с найденным number, сервер проверяет подпись,
   срок действия и то, что решение ещё не использовалось.

Ключ подписи выводится из SECRET_KEY, настраивать ничего не нужно.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from urllib.parse import parse_qs

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from modules.rate_limit.service import claim_once

ALGORITHM = "SHA-256"
EXPIRES_SECONDS = 10 * 60


def _hmac_key() -> bytes:
    return hmac.new(settings.secret_key.encode(), b"altcha", hashlib.sha256).digest()


def _sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _sign(challenge: str) -> str:
    return hmac.new(_hmac_key(), challenge.encode(), hashlib.sha256).hexdigest()


def create_challenge() -> dict:
    expires = int(time.time()) + EXPIRES_SECONDS
    salt = f"{secrets.token_hex(12)}?expires={expires}"
    number = secrets.randbelow(settings.altcha_max_number + 1)
    challenge = _sha256_hex(f"{salt}{number}")
    return {
        "algorithm": ALGORITHM,
        "challenge": challenge,
        "maxnumber": settings.altcha_max_number,
        "salt": salt,
        "signature": _sign(challenge),
    }


def _reject(detail: str = "Проверка на робота не пройдена. Обновите страницу.") -> None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


async def verify(db: AsyncSession, payload: str | None) -> None:
    """Бросает 400, если решение отсутствует, неверно, просрочено или уже использовано."""
    if not settings.altcha_enabled:
        return
    if not payload:
        _reject()
    try:
        data = json.loads(base64.b64decode(payload))
        algorithm = data["algorithm"]
        challenge = str(data["challenge"])
        number = int(data["number"])
        salt = str(data["salt"])
        signature = str(data["signature"])
    except (ValueError, KeyError, TypeError):
        _reject()

    if algorithm != ALGORITHM:
        _reject()

    params = parse_qs(salt.partition("?")[2])
    try:
        expires = int(params["expires"][0])
    except (KeyError, ValueError, IndexError):
        _reject()
    if expires < time.time():
        _reject("Проверка устарела. Обновите страницу и попробуйте снова.")

    if not hmac.compare_digest(_sha256_hex(f"{salt}{number}"), challenge):
        _reject()
    if not hmac.compare_digest(_sign(challenge), signature):
        _reject()

    if not await claim_once(db, f"altcha:{signature}", EXPIRES_SECONDS):
        _reject("Проверка уже использована. Обновите страницу.")
