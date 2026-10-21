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
# Слои идут от редко меняющихся к часто меняющимся: apt → pip → node → код.
# Сеть сборщика Timeweb медленно качает с deb.debian.org и PyPI, поэтому
# apt берём с зеркала Яндекса и ставим только nginx.
# =========================================================
FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    NEXT_TELEMETRY_DISABLED=1

# ---------------------------------------------------------
# System packages
# supervisor ставится из PyPI (requirements.txt), вместо gosu — setpriv,
# вместо curl в HEALTHCHECK — python: всё это уже есть в образе.
# ---------------------------------------------------------
RUN sed -i 's|http://deb.debian.org|https://mirror.yandex.ru|g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends nginx \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/* \
    # По умолчанию auto = число ядер хоста, а не контейнера
    && sed -i 's/^worker_processes .*/worker_processes 2;/' /etc/nginx/nginx.conf \
    && groupadd --system --gid 1001 app \
    && useradd  --system \
        --uid 1001 \
        --gid app \
        --home-dir /app \
        --shell /usr/sbin/nologin \
        app


# =========================================================
# Backend dependencies
# =========================================================
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

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:10000/health', timeout=4)" || exit 1

CMD ["/start.sh"]
