#!/bin/bash
set -e

cd /app/backend

# Команды приложения выполняем от пользователя app (setpriv есть в базовом образе).
# HOME=/app как у gosu: иначе asyncpg лезет в /root/.postgresql и падает с Permission denied.
as_app() { HOME=/app setpriv --reuid=app --regid=app --init-groups "$@"; }

echo "==> Running migrations..."
# БД может подняться позже контейнера: пробуем до минуты, а не падаем с первой ошибки.
for i in $(seq 1 30); do
    if as_app alembic upgrade head; then
        break
    fi
    if [ "$i" = 30 ]; then
        echo "==> Migrations failed, giving up"
        exit 1
    fi
    echo "==> Migrations failed, retry $i/30 in 2s..."
    sleep 2
done

as_app python scripts/create_admin.py

# CORS бакета S3 настраиваем один раз здесь, а не при старте каждого воркера.
# Если S3 не задан, это no-op; ошибка или зависание не мешают запуску.
HOME=/app timeout 30 setpriv --reuid=app --regid=app --init-groups \
    python -c "from modules.course import storage; storage.ensure_cors()" \
    || echo "==> S3 CORS setup skipped"

echo "==> Starting services (supervisord)..."
exec supervisord -c /etc/supervisord.conf
