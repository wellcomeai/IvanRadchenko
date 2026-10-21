# Базовый образ с Python-пакетами, nginx и curl собирается в GitHub Actions
# (Dockerfile.base, .github/workflows/base-image.yml): PyPI у сборщика Timeweb
# очень медленный. Чтобы собрать без него, как раньше, возьмите Dockerfile из
# ветки 2110.
ARG BASE_IMAGE=ghcr.io/wellcomeai/ivanradchenko-base:deps

# =========================================================
# Stage 1: Build frontend
# glibc-образ, как и рантайм: нативные модули из standalone-сборки
# (собранные под musl на alpine) в рантайме бы не загрузились.
# =========================================================
FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_URL=""

COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci --no-audit --no-fund

COPY frontend/ .

RUN npm run build


# =========================================================
# Stage 2: Runtime
# Multi-process:
# - nginx
# - gunicorn
# - nextjs standalone server
# managed by supervisord
#
# Пакеты уже стоят в базовом образе. pip ниже только сверяет версии и
# докачает новый пакет, если базовый образ ещё не успели пересобрать.
# =========================================================
FROM ${BASE_IMAGE}

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/backend

COPY backend/requirements.txt .

RUN pip install -r requirements.txt


# =========================================================
# Node.js (только для `node server.js` Next.js standalone)
# Бинарник из готового образа (Debian/glibc). Стоит после pip: новый
# патч-релиз Node меняет этот слой и не должен сбрасывать кэш pip.
# =========================================================
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node


# =========================================================
# Backend code
# =========================================================
COPY --chown=app:app backend/ .


# =========================================================
# Frontend (Next.js standalone)
# =========================================================
WORKDIR /app/frontend

COPY --from=frontend-builder --chown=app:app /app/.next/standalone ./

COPY --from=frontend-builder --chown=app:app /app/.next/static ./.next/static

COPY --from=frontend-builder --chown=app:app /app/public ./public


# =========================================================
# Configs
# =========================================================
COPY nginx-single.conf /etc/nginx/sites-available/default

COPY supervisord.conf /etc/supervisord.conf

COPY start.sh /start.sh

RUN sed -i 's/\r//' /start.sh \
    && chmod +x /start.sh \
    && rm -f /etc/nginx/sites-enabled/default \
    && ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default


# =========================================================
# Runtime
# =========================================================
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS --noproxy '*' http://127.0.0.1:10000/health || exit 1

CMD ["/start.sh"]
