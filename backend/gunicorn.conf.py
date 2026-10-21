"""Настройки gunicorn (подхватываются из рабочей директории /app/backend).

Число воркеров и таймаут можно менять через ENV в панели хостинга без пересборки:
WEB_CONCURRENCY (по умолчанию 2) и GUNICORN_TIMEOUT (по умолчанию 60 с).
"""
import os

bind = "127.0.0.1:8000"
worker_class = "uvicorn.workers.UvicornWorker"
workers = int(os.getenv("WEB_CONCURRENCY", "2"))
# Воркер должен уложиться в этот срок с импортом приложения и startup,
# а потом отмечаться не реже раза в timeout, иначе его убьют (WORKER TIMEOUT).
timeout = int(os.getenv("GUNICORN_TIMEOUT", "60"))
graceful_timeout = 30
keepalive = 5
# Плановый перезапуск воркеров против утечек памяти; jitter — чтобы не все сразу.
max_requests = 2000
max_requests_jitter = 200
# Отметки «жив» пишутся в файл: в /dev/shm (RAM), а не на диск контейнера.
worker_tmp_dir = "/dev/shm"
accesslog = "-"
errorlog = "-"
