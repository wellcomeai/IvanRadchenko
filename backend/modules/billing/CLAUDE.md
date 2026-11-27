# billing — контекст

## Назначение

Планы, подписки, платежи. Интеграция с Робокассой (готово) и Stripe
(заготовка).

## Файлы

- `models.py` — Plan, Subscription, Payment + enum'ы статусов
- `schemas.py` — Pydantic схемы
- `service.py` — list_plans, create_payment_for_plan, activate_paid_subscription, ...
- `robokassa.py` — `build_payment_url`, `verify_result_signature`
- `stripe.py` — заготовка, TODO для будущей реализации

## Модели

- **Plan**: name, price, currency, interval (month/year), features (JSON),
  is_active, sort_order
- **Subscription**: user_id, plan_id, status (trial/active/cancelled/...),
  current_period_start/end
- **Payment**: user_id, subscription_id, amount, currency, status, provider,
  provider_payment_id, payment_metadata (JSON)

## Бизнес-логика

**Курс продаётся не через Plan/Subscription**, а через `modules/course/access.py`
(весь курс или модули по порядку, доступ на год). Plan/Subscription остались от
шаблона: старые платежи по тарифам webhook обрабатывает как раньше.

Пробного периода нет: при регистрации подписка не создаётся (первый урок бесплатный).

### Чек 54-ФЗ

`robokassa.build_payment_url(..., receipt_item=...)` добавляет параметр `Receipt`
(одна позиция «услуга», полная оплата) и включает его в подпись
`MerchantLogin:OutSum:InvId:Receipt:Password1`. Настройки: `ROBOKASSA_RECEIPT_ENABLED`
(true), `ROBOKASSA_RECEIPT_TAX` (none), `ROBOKASSA_RECEIPT_SNO` (пусто — из магазина).

### Платёж

1. Frontend → `POST /billing/subscribe {plan_id, provider}`
2. Backend создаёт `Payment(status=pending)` и возвращает `payment_url`
3. Юзер платит на стороне провайдера
4. Провайдер шлёт webhook (`/api/v1/webhooks/robokassa`)
5. Webhook: проверка подписи и суммы → `course.access.activate_payment` (курс/модуль)
   или `activate_paid_subscription` (старые тарифы)
6. `referrals.process_payment_for_referral` создаёт payout если есть реферер

## Endpoints

```
GET  /api/v1/billing/plans
GET  /api/v1/billing/subscription
POST /api/v1/billing/subscribe
GET  /api/v1/billing/payments
POST /api/v1/billing/cancel
```

## Зависимости

- `modules.auth.models.User`
- `modules.referrals.service.process_payment_for_referral` (вызывается из webhook)
- `modules.notifications.service.create_notification`
- `modules.email.service.send_*`

## Как расширить

- **Реализовать Stripe**: см. TODO в `stripe.py` и `api/v1/public/webhooks.py`.
- **Скидки/промокоды**: новая таблица `coupons`, поле `coupon_id` в Payment.
- **Тарификация по использованию**: новая таблица `usage_events`,
  модель `MeteredItem`.

## Нельзя менять

- Webhook сигнатура с `OutSum/InvId/SignatureValue` — формат Робокассы.
- Поле `payment.payment_metadata['plan_id']` — используется в
  `activate_paid_subscription`; `payment_metadata['product']` — в оплате курса.
