"""Интеграция с Робокассой.

Документация: https://docs.robokassa.ru/

Используется два метода:
- build_payment_url: генерирует ссылку для редиректа на оплату
- verify_result_signature: проверяет подпись webhook-а
"""
from __future__ import annotations

import hashlib
import json
from decimal import Decimal
from typing import Any
from urllib.parse import quote, urlencode

from config import settings


_BASE_URL = "https://auth.robokassa.ru/Merchant/Index.aspx"


def _md5(data: str) -> str:
    return hashlib.md5(data.encode()).hexdigest()


def build_receipt(item_name: str, amount: Decimal) -> str:
    """Чек 54-ФЗ: одна позиция «услуга», полная оплата. Возвращает URL-кодированный JSON.

    По документации Робокассы Receipt входит в подпись в URL-кодированном виде,
    а в GET-ссылке кодируется ещё раз (это делает urlencode).
    """
    receipt: dict[str, Any] = {
        "items": [
            {
                "name": item_name[:128],
                "quantity": 1,
                "sum": float(f"{amount:.2f}"),
                "payment_method": "full_payment",
                "payment_object": "service",
                "tax": settings.robokassa_receipt_tax or "none",
            }
        ]
    }
    if settings.robokassa_receipt_sno:
        receipt["sno"] = settings.robokassa_receipt_sno
    return quote(json.dumps(receipt, ensure_ascii=False, separators=(",", ":")), safe="")


def build_payment_url(
    inv_id: int | str,
    amount: Decimal,
    description: str,
    user_email: str | None = None,
    receipt_item: str | None = None,
) -> str:
    """Сформировать URL для редиректа клиента на оплату.

    receipt_item — название позиции в чеке; передаётся, если включён
    ROBOKASSA_RECEIPT_ENABLED.
    """
    out_sum = f"{amount:.2f}"
    receipt = (
        build_receipt(receipt_item, amount)
        if receipt_item and settings.robokassa_receipt_enabled
        else None
    )
    sig_parts = [settings.robokassa_merchant_login, out_sum, str(inv_id)]
    if receipt:
        sig_parts.append(receipt)
    sig_parts.append(settings.robokassa_password1)
    signature = _md5(":".join(sig_parts))

    params: dict[str, Any] = {
        "MerchantLogin": settings.robokassa_merchant_login,
        "OutSum": out_sum,
        "InvId": inv_id,
        "Description": description,
        "SignatureValue": signature,
    }
    if receipt:
        params["Receipt"] = receipt
    if user_email:
        params["Email"] = user_email
    if settings.robokassa_test_mode:
        params["IsTest"] = "1"

    return f"{_BASE_URL}?{urlencode(params)}"


def verify_result_signature(out_sum: str, inv_id: str, signature: str) -> bool:
    """Проверка подписи в Result URL (webhook).

    Использует password2 — это критично.
    """
    expected = _md5(f"{out_sum}:{inv_id}:{settings.robokassa_password2}")
    return expected.lower() == signature.lower()
