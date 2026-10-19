# Модуль course — курс «Школы Независимости»

## Назначение

Онлайн-курс: 6 модулей → уроки → материалы (видео и файлы). Тексты (названия,
описания) хранятся в PostgreSQL, сами файлы — в приватном S3-хранилище Timeweb.

## Файлы

- `models.py` — `CourseModule`, `Lesson`, `LessonMaterial`
- `schemas.py` — Pydantic-схемы (ученик / админ / загрузка)
- `service.py` — бизнес-логика
- `storage.py` — работа с S3 (boto3, подписанные ссылки, CORS бакета)
- Роутер: `api/v1/internal/course.py` (`router` для учеников, `admin_router` для админа)
- Миграция: `alembic/versions/0011_course.py` (таблицы + 6 стартовых модулей)

## Модель данных

- `course_modules` — `position` (1–6, уникальный), `title`, `description`.
  Модули создаёт миграция; админ меняет только тексты.
- `course_lessons` — `module_id`, `title`, `description`, `position` (порядок в модуле),
  `is_published` (черновики видит только админ).
- `course_lesson_materials` — `kind` (`video` | `file`), `title`, `filename`,
  `content_type`, `size_bytes`, `storage_key` (путь в S3), `upload_id`
  (идёт multipart-загрузка), `is_uploaded`.

## Endpoints

Ученик (JWT, любой вошедший — пока обучение бесплатное):
- `GET /api/v1/course/program` — программа для лендинга, **без входа**
- `GET /api/v1/course/modules` — модули и уроки для сайдбара
- `GET /api/v1/course/lessons/{id}` — урок + ссылки на видео/файлы + соседние уроки

Админ (`/api/v1/admin/course/*`, role=admin):
- `GET storage` — подключено ли S3
- `GET modules`, `PATCH modules/{id}`
- `POST lessons`, `GET|PATCH|DELETE lessons/{id}`, `PUT lessons/order`
- `POST lessons/{id}/uploads` — начать загрузку → ссылки на части
- `POST materials/{id}/complete` — собрать части в файл
- `PATCH|DELETE materials/{id}`

## Загрузка видео (важно)

Файлы **не идут через наш сервер** (nginx, лимиты тела запроса, память):
1. Фронт вызывает `uploads` → сервер делает `create_multipart_upload` и подписывает
   ссылки на каждую часть (16 МБ, для огромных файлов больше; ссылки живут сутки).
2. Браузер шлёт части `PUT` прямо в S3 (с `Content-Type: application/octet-stream`)
   и собирает `ETag` каждой части. Для этого у бакета CORS с `ExposeHeaders: ETag` —
   его ставит `storage.ensure_cors()` при старте приложения.
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

- Доступ по оплате: заменить `CurrentUser` на `ActiveSubscription` в ученических роутах.
- Проверка заданий нейросетью: добавить модели заданий/ответов, привязанные к `Lesson`.
