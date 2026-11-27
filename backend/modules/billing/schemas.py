"""Pydantic схемы для billing."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field


class PlanPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    price: Decimal
    currency: str
    interval: str
    features: list[str]
    sort_order: int


class SubscriptionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan_id: UUID | None = None
    status: str
    current_period_start: datetime
    current_period_end: datetime
    cancelled_at: datetime | None = None


class SubscribeRequest(BaseModel):
    plan_id: UUID
    provider: str  # "robokassa" | "stripe"


class SubscribeResponse(BaseModel):
    payment_url: str
    payment_id: UUID


class PaymentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    amount: Decimal
    currency: str
    status: str
    provider: str
    created_at: datetime
    payment_metadata: dict | None = Field(default=None, exclude=True)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def title(self) -> str:
        """Что оплачено — для истории платежей."""
        meta = self.payment_metadata or {}
        if meta.get("product") == "course":
            return "Весь курс"
        if meta.get("product") == "module":
            return f"Модуль {meta.get('module_position', '')}".strip()
        return meta.get("plan_name") or "Оплата"
