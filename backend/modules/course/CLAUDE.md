# Модуль course — курс «Школы Независимости»

## Назначение

Онлайн-курс: 6 модулей → уроки → материалы (видео и файлы). Тексты (названия,
описания) хранятся в PostgreSQL, сами файлы — в приватном S3-хранилище Timeweb.

## Файлы

- `models.py` — `CourseModule`, `Lesson`, `LessonMaterial`
- `schemas.py` — Pydantic-схемы (ученик / админ / загрузка)
- `service.py` — бизнес-логика (контент курса)
- `access.py` — продажа, доступ учеников, пошаговое прохождение, админка учеников
- `storage.py` — работа с S3 (boto3, подписанные ссылки, CORS бакета)
- Роутер: `api/v1/internal/course.py` (`router` для учеников, `admin_router` для админа)
- Миграции: `0011_course.py` (таблицы + 6 стартовых модулей),
  `0012_course_access.py` (цены, доступы, прогресс)

## Модель данных

- `course_modules` — `position` (1–6, уникальный), `title`, `description`.
  Модули создаёт миграция; админ меняет только тексты.
- `course_lessons` — `module_id`, `title`, `description`, `position` (порядок в модуле),
  `is_published` (черновики видит только админ).
- `course_lesson_materials` — `kind` (`video` | `file`), `title`, `filename`,
  `content_type`, `size_bytes`, `storage_key` (путь в S3), `upload_id`
  (идёт multipart-загрузка), `is_uploaded`.
- `course_modules.price` — цена модуля при покупке отдельно (по умолчанию 4300).
- `course_settings` (одна строка id=1) — `full_price` (весь курс, 25800), `access_days` (365).
- `course_access` — доступ ученика: `module_id = NULL` — весь курс, иначе модуль;
  `starts_at/expires_at`, `source` (`payment` | `admin`), `payment_id`, `revoked_at`.
  Продление: новый доступ начинается после окончания текущего такого же.
- `course_lesson_progress` — `first_opened_at`, `last_opened_at`, `completed_at`
  (кнопка «Урок пройден»). Админ в прогресс не пишется.

## Правила доступа (`access.py`)

- Первый опубликованный урок курса бесплатный, пробного периода нет.
- Урок открыт, если его модуль оплачен (или урок бесплатный) **и** все предыдущие
  опубликованные уроки курса пройдены — в том числе через границу модулей.
  Статусы: `completed`, `available`, `locked_sequence`, `locked_payment`.
- Закрытый урок → `403 {"detail": {"code": "locked_payment" | "locked_sequence"}}`.
- Модуль N можно купить, только если раньше был доступ к N−1 (или к курсу).
  Купить/продлить можно, если доступа нет или до конца ≤ 30 дней.
- Админ видит всё и может выдать/отозвать доступ вручную.

## Endpoints

Ученик (JWT):
- `GET /api/v1/course/program` — программа для лендинга, **без входа**
- `GET /api/v1/course/pricing` — цены для оферты, **без входа**
- `GET /api/v1/course/modules` — модули, уроки и статус каждого урока
- `GET /api/v1/course/lessons/{id}` — урок + ссылки на видео/файлы (отмечает «открыт»)
- `POST /api/v1/course/lessons/{id}/complete` — «Урок пройден»
- `GET /api/v1/course/shop` — что можно купить
- `POST /api/v1/course/checkout {product: course|module, module_id}` → `payment_url`

Оплата: `Payment.payment_metadata = {"product": "course"|"module", "module_id", "access_days"}`.
Webhook Робокассы (`api/v1/public/webhooks.py`) проверяет подпись и сумму и для таких
платежей вызывает `access.activate_payment` (идемпотентно по `payment_id`).
В Робокассу передаётся чек 54-ФЗ (`Receipt`, см. `billing/robokassa.py`).

Админ (`/api/v1/admin/course/*`, role=admin):
- `GET storage` — подключено ли S3
- `GET modules`, `PATCH modules/{id}`
- `POST lessons`, `GET|PATCH|DELETE lessons/{id}`, `PUT lessons/order`
- `POST lessons/{id}/uploads` — начать загрузку → ссылки на части
- `POST materials/{id}/complete` — собрать части в файл
- `PATCH|DELETE materials/{id}`
- `GET|PATCH settings` — цена курса и срок доступа; цена модуля — `PATCH modules/{id} {price}`
- `GET students?search=&page=`, `GET students/{user_id}` — ученики и прогресс
- `POST access {user_id, module_id|null, days?}`, `DELETE access/{id}` — ручной доступ

## Загрузка видео (важно)

Файлы **не идут через наш сервер** (nginx, лимиты тела запроса, память):
1. Фронт вызывает `uploads` → сервер делает `create_multipart_upload` и подписывает
   ссылки на каждую часть (16 МБ, для огромных файлов больше; ссылки живут сутки).
2. Браузер шлёт части `PUT` прямо в S3 (с `Content-Type: application/octet-stream`)
   и собирает `ETag` каждой части. Для этого у бакета CORS с `ExposeHeaders: ETag` —
   его ставит `storage.ensure_cors()` из `start.sh` при старте контейнера (один раз,
   до gunicorn: сетевой вызов в startup воркера приводил к WORKER TIMEOUT).
3. Фронт вызывает `complete` → `complete_multipart_upload`, сервер проверяет размер.
   Отменённая/упавшая загрузка удаляется (`DELETE materials/{id}` → abort).

Просмотр: подписанная ссылка `get_object` на 6 часов (страница урока
перезапрашивает данные каждые 4 часа). Бакет приватный — прямых ссылок нет.

## Настройки

`S3_ENDPOINT` (https://s3.twcstorage.ru), `S3_REGION` (ru-1), `S3_BUCKET`,
`S3_ACCESS_KEY`, `S3_SECRET_KEY`. Без них `settings.storage_enabled == False`:
уроки работают, загрузка отвечает 503. В продакшне их прописывает
`deploy_timeweb.py create-bucket`.

boto3 закреплён на 1.35.x: с 1.36 он шлёт новые контрольные суммы, которые
S3-совместимые хранилища понимают не всегда.

## Дальше

- Проверка заданий нейросетью: добавить модели заданий/ответов, привязанные к `Lesson`.
