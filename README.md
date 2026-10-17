# OpenSaaS

Open source SaaS boilerplate на Python (FastAPI) + Next.js 14. Лицензия MIT.

## Запуск за 15 минут через AI-агента

1. Сделайте Fork этого репозитория.
2. Откройте свою копию в Claude Code или Codex (подойдут и другие агенты, которые читают `AGENTS.md`).
3. Напишите агенту: «Вот мой ключ от Timeweb — задеплой сервис: <ключ>».
   Агент покажет цену, спросит согласие и email админа, а затем выдаст ссылку и пароль.
   Агент действует по пошаговой инструкции [`DEPLOY.md`](DEPLOY.md).

Не понимаете, как всё устроено? Напишите агенту «Объясни, как работает этот проект».
Включится наставник (`.claude/skills/opensaas-mentor`): он объяснит всё простыми словами
и поможет с доработками по шагам.

Полный набор базовых функций для быстрого старта любого SaaS-продукта:
аутентификация, биллинг (Робокасса + заготовка Stripe), реферальная
система, API-ключи, уведомления, админка, email-подтверждение.

## Стек

**Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0 async, PostgreSQL 15,
Alembic, Pydantic v2, JWT, bcrypt, aiosmtplib, Redis (опционально).

**Frontend:** Next.js 14 App Router, TypeScript strict, shadcn/ui,
Tailwind CSS, TanStack Query, Zustand, react-hook-form + zod.

**Инфраструктура:** один Docker-контейнер (Next.js + FastAPI + Nginx) в
Timeweb Cloud App Platform, управляемая PostgreSQL 15, Redis 7 (опционально).
Локально — docker-compose.

## Локальная разработка

```bash
# 1. Клонировать репозиторий
git clone <repo-url> opensaas && cd opensaas

# 2. Подготовить .env
cp .env.example .env
# Заполнить переменные

# 3. Запустить инфраструктуру
docker-compose up -d          # без Redis
docker-compose --profile with-redis up -d   # с Redis

# 4. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python scripts/create_admin.py
uvicorn main:app --reload --port 8000

# 5. Frontend (в новом терминале)
cd frontend
npm install
npm run dev
```

Приложение доступно:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- API Docs (Swagger): <http://localhost:8000/docs>

## Структура

```
opensaas/
├── backend/          # FastAPI приложение
│   ├── api/v1/       # API роуты (internal + public)
│   ├── modules/      # Бизнес-модули (auth, billing, referrals, ...)
│   ├── alembic/      # Миграции
│   └── scripts/      # Утилиты (создание админа, ...)
├── frontend/         # Next.js приложение
│   ├── src/app/      # App Router страницы
│   ├── src/api/      # API клиенты
│   └── src/components/
├── docs/             # Документация
├── docker-compose.yml
├── Dockerfile        # единственная сборка для продакшна (Timeweb)
├── DEPLOY.md         # пошаговая инструкция деплоя
└── .env.example
```

Каждый модуль содержит `CLAUDE.md` с контекстом для AI-агентов
(Claude Code и др.) — это упрощает доработку проекта.

## Документация

- [Getting Started](docs/getting-started.md)
- [Архитектура](docs/architecture.md)
- [Добавление модулей](docs/adding-modules.md)
- [Деплой в Timeweb Cloud](DEPLOY.md)
- [Запуск на своём компьютере](LOCAL_SETUP.md)

## Лицензия

MIT — см. [LICENSE](LICENSE).
