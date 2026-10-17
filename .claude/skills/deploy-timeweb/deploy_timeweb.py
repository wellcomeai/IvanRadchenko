#!/usr/bin/env python3
"""Деплой OpenSaaS в Timeweb Cloud App Platform одной командой.

Создаёт управляемую PostgreSQL + приложение App Platform (корневой Dockerfile,
всё в одном контейнере), прописывает ENV, ждёт деплой и печатает ссылку.

Только стандартная библиотека Python 3.9+, работает на Windows/macOS/Linux.

Токен API берётся из переменной окружения TIMEWEB_TOKEN или флага --token.
Токен НИКОГДА не пишется на диск и в репозиторий.

Команды:
  check                     проверить токен, баланс, подключённый GitHub и репозиторий
  plan                      показать тарифы и итоговую цену (ничего не создаёт)
  deploy --email E --yes    создать БД + приложение и задеплоить
  set-env K=V [K=V ...]     добавить/изменить ENV и дождаться передеплоя
  unset-env K [K ...]       удалить ENV и дождаться передеплоя
  test-email                отправить проверочное письмо админу и показать ошибку SMTP
  status                    статус приложения, БД и последнего деплоя
  logs [-n 80]              последние строки логов приложения
  redeploy                  пересобрать последний коммит ветки
"""
from __future__ import annotations

import argparse
import json
import os
import re
import secrets
import string
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API = "https://api.timeweb.cloud/api/v1"
DEFAULT_LOCATION = "ru-3"  # Москва (зона msk-1)
PG_TYPE = "postgres16"
APP_RAM_MB = 2048  # сборке Next.js нужно 2 ГБ, на 1 ГБ сборка может упасть
DB_MIN_RAM_MB = 1024
# Публичный IP для БД тарифицируется отдельно (в API цены нет, значение по тарифам Timeweb).
PUBLIC_IP_PRICE = 200
STATE_DIR = Path.home() / ".opensaas-timeweb"

DEPLOY_DONE = {"success", "failure", "failed", "error", "canceled", "cancelled"}
ALNUM = string.ascii_letters + string.digits


# --------------------------------------------------------------------------- utils

def die(msg: str) -> None:
    print(f"\n[ОШИБКА] {msg}", file=sys.stderr)
    sys.exit(1)


def step(msg: str) -> None:
    print(f"\n==> {msg}", flush=True)


def info(msg: str) -> None:
    print(f"    {msg}", flush=True)


def gen_password(n: int) -> str:
    # Только буквы и цифры: пароль попадает в DATABASE_URL и в конфиг alembic
    # (configparser ломается на '%'), спецсимволы там только мешают.
    return "".join(secrets.choice(ALNUM) for _ in range(n))


class Api:
    def __init__(self, token: str):
        self.token = token

    def call(self, method: str, path: str, body: dict | None = None, ok404: bool = False):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(
            API + path,
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            },
        )
        for attempt in range(4):
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    raw = r.read().decode() or "{}"
                    return json.loads(raw)
            except urllib.error.HTTPError as e:
                text = e.read().decode(errors="replace")
                if e.code == 404 and ok404:
                    return None
                if e.code in (429, 502, 503, 504) and attempt < 3:
                    time.sleep(2 ** (attempt + 1))
                    continue
                if e.code == 401:
                    die("Timeweb отклонил API-ключ (401). Проверьте, что ключ скопирован целиком и не удалён.")
                die(f"{method} {path} -> HTTP {e.code}: {text[:1500]}")
            except urllib.error.URLError as e:
                if attempt < 3:
                    time.sleep(2 ** (attempt + 1))
                    continue
                die(f"Нет связи с api.timeweb.cloud: {e}")
        return None

    get = lambda self, p, **kw: self.call("GET", p, **kw)  # noqa: E731
    post = lambda self, p, b=None: self.call("POST", p, b)  # noqa: E731
    patch = lambda self, p, b=None: self.call("PATCH", p, b)  # noqa: E731


def wait(what: str, fn, timeout: int, interval: int = 10):
    """Вызывать fn() пока не вернёт truthy, печатая прогресс."""
    start = time.time()
    last = None
    while True:
        res, label = fn()
        if label != last:
            info(f"{what}: {label}  ({int(time.time() - start)}с)")
            last = label
        if res:
            return res
        if time.time() - start > timeout:
            die(f"Не дождались: {what} (последний статус: {label}) за {timeout}с")
        time.sleep(interval)


# ------------------------------------------------------------------------- git / repo

def detect_repo() -> str | None:
    """owner/name из git remote origin (github, ssh, прокси-URL)."""
    try:
        url = subprocess.check_output(
            ["git", "remote", "get-url", "origin"], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        return None
    url = re.sub(r"\.git$", "", url.rstrip("/"))
    parts = re.split(r"[/:]", url)
    if len(parts) >= 2:
        return f"{parts[-2]}/{parts[-1]}"
    return None


def find_repo(api: Api, full_name: str):
    """Вернуть (provider_id, repo_id, provider_login) для owner/name."""
    providers = api.get("/vcs-provider").get("providers", [])
    gh = [p for p in providers if p.get("provider") == "github"]
    if not gh:
        die(
            "В Timeweb не подключён GitHub. Попросите человека: панель Timeweb → App Platform → "
            "«Создать» → значок GitHub → авторизоваться и дать доступ к репозиторию. "
            "Форму дальше заполнять и заказывать НЕ нужно, после подключения повторите команду."
        )
    want = full_name.lower()
    seen = []
    for p in gh:
        detail = api.get(f"/vcs-provider/{p['provider_id']}")
        for r in detail.get("repositories", []):
            fn = (r.get("full_name") or "").lower()
            seen.append(r.get("full_name"))
            if fn == want:
                return p["provider_id"], r["id"], p.get("login")
    die(
        f"Репозиторий {full_name} не виден Timeweb. Доступные: {', '.join(filter(None, seen)) or 'нет'}.\n"
        "Попросите человека выдать доступ к репозиторию в настройках GitHub App Timeweb "
        "(GitHub → Settings → Applications → Timeweb Cloud → Configure → Repository access)."
    )


def latest_commit(api: Api, provider_id: str, repo_id: str, branch: str) -> str:
    r = api.get(f"/vcs-provider/{provider_id}/repository/{repo_id}/branch?name={branch}")
    commits = (r or {}).get("commits") or []
    if not commits:
        die(f"Не нашли коммитов в ветке {branch}. Ветка существует и запушена?")
    return commits[0]["sha"]


# ----------------------------------------------------------------------------- presets

def pick_presets(api: Api, location: str):
    dbp = api.get("/presets/dbs").get("databases_presets", [])
    dbp = [p for p in dbp if p.get("type") == "postgres" and p.get("location") == location
           and p.get("ram", 0) >= DB_MIN_RAM_MB]
    if not dbp:
        die(f"Нет тарифов PostgreSQL в локации {location}")
    db = min(dbp, key=lambda p: p["price"])

    ap = api.get("/presets/apps").get("backend_presets", [])
    ap = [p for p in ap if p.get("location") == location and p.get("ram", 0) >= APP_RAM_MB]
    if not ap:
        die(f"Нет тарифов App Platform в локации {location}")
    app = min(ap, key=lambda p: p["price"])
    return db, app


def finances(api: Api) -> dict:
    return api.get("/account/finances")["finances"]


# ------------------------------------------------------------------------------ state

def state_path(app_name: str) -> Path:
    return STATE_DIR / f"{app_name}.json"


def load_state(app_name: str) -> dict:
    p = state_path(app_name)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def save_state(app_name: str, st: dict) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    p = state_path(app_name)
    p.write_text(json.dumps(st, ensure_ascii=False, indent=2), encoding="utf-8")
    try:
        os.chmod(p, 0o600)
    except OSError:
        pass


# --------------------------------------------------------------------------------- DB

def find_db(api: Api, name: str):
    for d in api.get("/databases").get("dbs", []):
        if d.get("name") == name:
            return d
    return None


def db_public_ip(db: dict) -> str | None:
    for n in db.get("networks") or []:
        if n.get("type") == "public":
            for ip in n.get("ips", []):
                if ip.get("type") == "ipv_4":
                    return ip["ip"]
    return None


def ensure_db(api: Api, name: str, preset_id: int, st: dict) -> dict:
    db = find_db(api, name)
    if db is None:
        st.setdefault("db_password", gen_password(28))
        step(f"Создаю PostgreSQL «{name}»")
        db = api.post("/databases", {
            "name": name,
            "type": PG_TYPE,
            "preset_id": preset_id,
            "admin": {"password": st["db_password"], "for_all": True},
            "instance": {"name": "opensaas_db"},
        })["db"]
    else:
        step(f"PostgreSQL «{name}» уже есть (id {db['id']}), использую её")
        if "db_password" not in st:
            die("БД уже существует, но её пароль неизвестен (нет файла состояния). "
                "Удалите БД в панели или задайте DATABASE_URL вручную через set-env.")
    db_id = db["id"]
    st["db_id"] = db_id

    def started():
        d = api.get(f"/databases/{db_id}")["db"]
        return (d if d["status"] == "started" else None), d["status"]
    db = wait("статус БД", started, timeout=900, interval=15)

    if not db_public_ip(db):
        step("Включаю публичный IP для БД (иначе App Platform до неё не достучится)")
        api.patch(f"/databases/{db_id}", {"is_enabled_public_network": True})

        def has_ip():
            d = api.get(f"/databases/{db_id}")["db"]
            return (d if db_public_ip(d) and d["status"] == "started" else None), d["status"]
        db = wait("публичный IP", has_ip, timeout=300)
    st["db_host"] = db_public_ip(db)
    info(f"Адрес БД: {st['db_host']}:{db.get('port', 5432)}")
    st["db_port"] = db.get("port", 5432)
    return db


def regrant_db_privileges(api: Api, db_id: int) -> tuple[str, str]:
    """Повторно выдать права пользователю БД.

    Известная проблема Timeweb: сразу после создания кластера права пользователя
    отображаются как выданные, но в самом PostgreSQL их нет → приложение падает с
    'User does not have CONNECT privilege'. Повторный PATCH прав это лечит.
    Возвращает (login, instance_name).
    """
    instances = api.get(f"/databases/{db_id}/instances")["instances"]
    inst = next((i for i in instances if i["name"] == "opensaas_db"), instances[0])

    def admin_ready():
        admins = api.get(f"/databases/{db_id}/admins")["admins"]
        a = admins[0] if admins else None
        return (a if a and a["status"] == "created" else None), (a["status"] if a else "нет пользователя")
    admin = wait("пользователь БД", admin_ready, timeout=600)

    step(f"Повторно выдаю права пользователю {admin['login']} (обход бага Timeweb с CONNECT)")
    privs = ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "TRUNCATE",
             "REFERENCES", "TRIGGER", "TEMPORARY", "CONNECT"]
    api.patch(f"/databases/{db_id}/admins/{admin['id']}",
              {"instance_id": inst["id"], "privileges": privs})
    time.sleep(5)
    wait("права пользователя", admin_ready, timeout=600)
    return admin["login"], inst["name"]


# -------------------------------------------------------------------------------- App

def find_app(api: Api, name: str):
    for a in api.get("/apps").get("apps", []):
        if a.get("name") == name:
            return a
    return None


def app_domain(app: dict) -> str | None:
    doms = app.get("domains") or []
    ext = [d["fqdn"] for d in doms if d.get("is_external")]
    tech = [d["fqdn"] for d in doms if d.get("is_technical")]
    return (ext or tech or [None])[0]


def deploys(api: Api, app_id: int) -> list:
    return api.get(f"/apps/{app_id}/deploys").get("deploys", [])


def wait_deploy(api: Api, app_id: int, known_ids: set | None = None, timeout: int = 1500) -> dict:
    """Дождаться завершения деплоя. Если known_ids задан — ждём НОВЫЙ деплой."""
    if known_ids is not None:
        def new_deploy():
            ds = deploys(api, app_id)
            fresh = [d for d in ds if d["id"] not in known_ids]
            return (fresh[0] if fresh else None), ("появился" if fresh else "ожидание запуска")
        start = time.time()
        d = None
        while time.time() - start < 90:
            d, _ = new_deploy()
            if d:
                break
            time.sleep(5)
        if d is None:
            info("Timeweb сам не запустил деплой — запускаю вручную")
            redeploy(api, app_id)

    def done():
        ds = deploys(api, app_id)
        d = ds[0] if ds else None
        s = d["status"] if d else "нет деплоев"
        return (d if s in DEPLOY_DONE else None), s
    return wait("деплой", done, timeout=timeout, interval=15)


def redeploy(api: Api, app_id: int) -> None:
    app = api.get(f"/apps/{app_id}")["app"]
    sha = app.get("commit_sha")
    prov = app.get("provider") or {}
    repo = app.get("repository") or {}
    branch = (app.get("branch") or {}).get("name") if isinstance(app.get("branch"), dict) else app.get("branch")
    try:
        if prov.get("id") and repo.get("id") and branch:
            sha = latest_commit(api, prov["id"], repo["id"], branch)
    except SystemExit:
        pass
    api.post(f"/apps/{app_id}/deploy", {"commit_sha": sha})


def app_logs(api: Api, app_id: int) -> list[str]:
    return api.get(f"/apps/{app_id}/logs").get("app_logs", [])


def check_health(domain: str) -> str:
    url = f"https://{domain}/health"
    for _ in range(12):
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                return f"{r.status}"
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}"
        except Exception as e:  # SSL-сертификат может выпускаться пару минут
            last = type(e).__name__
        time.sleep(10)
    return f"не ответил ({last})"


def update_envs(api: Api, app_id: int, updates: dict, remove: tuple = ()) -> dict:
    app = api.get(f"/apps/{app_id}")["app"]
    envs = dict(app.get("envs") or {})
    envs.update({k: str(v) for k, v in updates.items()})
    for k in remove:
        envs.pop(k, None)
    known = {d["id"] for d in deploys(api, app_id)}
    api.patch(f"/apps/{app_id}", {"envs": envs})
    return wait_deploy(api, app_id, known_ids=known)


# ---------------------------------------------------------------------------- commands

def ctx(args) -> tuple[Api, str, str]:
    token = args.token or os.environ.get("TIMEWEB_TOKEN")
    if not token:
        die("Нет API-ключа. Передайте через переменную окружения TIMEWEB_TOKEN или --token.")
    repo = args.repo or detect_repo()
    if not repo:
        die("Не удалось определить репозиторий из git remote. Укажите --repo owner/name.")
    app_name = args.name or repo.split("/")[1]
    return Api(token.strip()), repo, app_name


def cmd_check(args):
    api, repo, app_name = ctx(args)
    f = finances(api)
    step("API-ключ рабочий")
    info(f"Баланс: {f['balance']} {f.get('currency', 'RUB')}, уже тратится {f['monthly_cost']} ₽/мес "
         f"(хватит на ~{f.get('hours_left')} ч)")
    pid, rid, login = find_repo(api, repo)
    step(f"GitHub подключён ({login}), репозиторий {repo} виден Timeweb")
    sha = latest_commit(api, pid, rid, args.branch)
    info(f"Ветка {args.branch}: последний коммит {sha[:7]}")
    existing = find_app(api, app_name)
    if existing:
        info(f"Приложение «{app_name}» уже существует (id {existing['id']}, статус {existing['status']})")
    print("\nOK: можно запускать plan / deploy")


def cmd_plan(args):
    api, repo, app_name = ctx(args)
    db, app = pick_presets(api, args.location)
    f = finances(api)
    total = db["price"] + app["price"] + PUBLIC_IP_PRICE
    new_monthly = f["monthly_cost"] + total
    hourly = new_monthly / 720
    print(json.dumps({
        "location": args.location,
        "database": {"preset_id": db["id"], "cpu": db["cpu"], "ram_mb": db["ram"],
                     "disk_mb": db["disk"], "price_month": db["price"]},
        "app": {"preset_id": app["id"], "cpu": app["cpu"], "ram_mb": app["ram"],
                "disk_mb": app["disk"], "price_month": app["price"]},
        "public_ip_price_month": PUBLIC_IP_PRICE,
        "total_new_month": total,
        "balance": f["balance"],
        "already_spending_month": f["monthly_cost"],
        "days_left_after": round(f["balance"] / hourly / 24, 1) if hourly else None,
    }, ensure_ascii=False, indent=2))
    print(
        f"\nБудет создано (локация {args.location}):\n"
        f"  • PostgreSQL {db['cpu']} CPU / {db['ram'] // 1024} ГБ RAM / {db['disk'] // 1024} ГБ — {db['price']} ₽/мес\n"
        f"  • Приложение  {app['cpu']} CPU / {app['ram'] // 1024} ГБ RAM / {app['disk'] // 1024} ГБ — {app['price']} ₽/мес\n"
        f"  • Публичный IP для БД — ~{PUBLIC_IP_PRICE} ₽/мес\n"
        f"  Итого +{total} ₽/мес (списывается почасово, ~{total / 720:.2f} ₽/ч).\n"
        f"  Баланс {f['balance']} ₽ — с учётом уже работающих услуг хватит примерно на "
        f"{f['balance'] / hourly / 24:.1f} дн."
    )


def cmd_deploy(args):
    api, repo, app_name = ctx(args)
    if not args.yes:
        die("Деплой создаёт платные ресурсы. Покажите человеку цену (команда plan), "
            "получите явное согласие и запустите с флагом --yes.")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", args.email or ""):
        die("Нужен корректный --email администратора (спросите у человека).")

    st = load_state(app_name)
    st.update({"repo": repo, "app_name": app_name, "location": args.location, "admin_email": args.email})

    step("Проверяю API-ключ, баланс и GitHub")
    f = finances(api)
    info(f"Баланс: {f['balance']} ₽")
    pid, rid, _ = find_repo(api, repo)
    sha = latest_commit(api, pid, rid, args.branch)
    info(f"{repo}@{args.branch} → {sha[:7]}")
    db_preset, app_preset = pick_presets(api, args.location)

    # ---- БД
    db = ensure_db(api, f"{app_name.lower()}-db", db_preset["id"], st)
    save_state(app_name, st)
    db_user, db_name = regrant_db_privileges(api, db["id"])
    database_url = (f"postgresql+asyncpg://{db_user}:{st['db_password']}"
                    f"@{st['db_host']}:{st['db_port']}/{db_name}")

    # ---- Приложение
    st.setdefault("admin_password", gen_password(16))
    st.setdefault("secret_key", secrets.token_urlsafe(48))
    save_state(app_name, st)

    envs = {
        "DATABASE_URL": database_url,
        "SECRET_KEY": st["secret_key"],
        "ALGORITHM": "HS256",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
        "REFRESH_TOKEN_EXPIRE_DAYS": "30",
        "ADMIN_EMAIL": args.email,
        "ADMIN_PASSWORD": st["admin_password"],
        "ENVIRONMENT": "production",
        "APP_NAME": args.app_title,
        # APP_URL не задаём: бэкенд берёт адрес сайта из заголовка Host запроса,
        # поэтому передеплой после выдачи домена не нужен. CORS тоже не нужен:
        # фронт и API на одном домене.
        "ROBOKASSA_TEST_MODE": "false",  # только боевые платежи, тестовые пароли не используем
        "STRIPE_ENABLED": "false",
    }

    app = find_app(api, app_name)
    if app is None:
        step(f"Создаю приложение App Platform «{app_name}» (Dockerfile из корня, ветка {args.branch})")
        app = api.post("/apps", {
            "provider_id": pid,
            "repository_id": rid,
            "type": "backend",
            "preset_id": app_preset["id"],
            "branch_name": args.branch,
            "is_auto_deploy": True,
            "commit_sha": sha,
            "name": app_name,
            "comment": "OpenSaaS (single Dockerfile)",
            "framework": "docker",
            "build_cmd": "",
            "run_cmd": "",
            "envs": envs,
        })["app"]
        known = None
    else:
        step(f"Приложение «{app_name}» уже есть (id {app['id']}), обновляю ENV")
        known = {d["id"] for d in deploys(api, app["id"])}
        cur = dict(app.get("envs") or {})
        cur.update(envs)
        api.patch(f"/apps/{app['id']}", {"envs": cur})
    app_id = app["id"]
    st["app_id"] = app_id
    save_state(app_name, st)

    step("Жду сборку и запуск (обычно 4–6 минут)")
    d = wait_deploy(api, app_id, known_ids=known)
    if d["status"] != "success":
        logs = "".join(app_logs(api, app_id)[-60:])
        if "CONNECT privilege" in logs or "permission denied for database" in logs:
            info("Приложение не получило доступ к БД — ещё раз выдаю права и передеплою")
            regrant_db_privileges(api, db["id"])
            known = {x["id"] for x in deploys(api, app_id)}
            redeploy(api, app_id)
            d = wait_deploy(api, app_id, known_ids=known)
        if d["status"] != "success":
            print(logs[-4000:])
            die(f"Деплой завершился со статусом {d['status']}. Логи выше; команда `logs` покажет больше.")

    app = api.get(f"/apps/{app_id}")["app"]
    domain = app_domain(app)
    st["domain"] = domain
    save_state(app_name, st)
    url = f"https://{domain}"

    step("Проверяю, что сайт отвечает снаружи")
    health = check_health(domain)
    info(f"GET {url}/health → {health}")

    print("\n" + "=" * 60)
    print("ГОТОВО")
    print(f"  Сайт:            {url}")
    print(f"  Админ логин:     {args.email}")
    print(f"  Админ пароль:    {st['admin_password']}")
    print(f"  App ID:          {app_id}   DB ID: {db['id']}")
    print(f"  Webhook Робокассы (Result URL): {url}/api/v1/webhooks/robokassa")
    print(f"  Секреты сохранены локально: {state_path(app_name)}")
    print("  Почта:           не настроена. Регистрация работает сразу, без кода из письма.")
    print("                   Как включить письма: SKILL.md, шаг 5.")
    print("=" * 60)


def _app_id(api: Api, app_name: str, args) -> int:
    if getattr(args, "app_id", None):
        return args.app_id
    st = load_state(app_name)
    if st.get("app_id"):
        return st["app_id"]
    app = find_app(api, app_name)
    if not app:
        die(f"Приложение «{app_name}» не найдено. Укажите --app-id или --name.")
    return app["id"]


def cmd_set_env(args):
    api, repo, app_name = ctx(args)
    updates = {}
    for kv in args.pairs:
        if "=" not in kv:
            die(f"Ожидается KEY=VALUE, получено: {kv}")
        k, v = kv.split("=", 1)
        updates[k.strip()] = v
    app_id = _app_id(api, app_name, args)
    step(f"Обновляю ENV: {', '.join(updates)} и жду передеплой")
    d = update_envs(api, app_id, updates)
    if d["status"] != "success":
        print("".join(app_logs(api, app_id)[-60:])[-4000:])
        die(f"Деплой после изменения ENV: {d['status']}")
    print("OK: переменные применены, приложение перезапущено")


def cmd_unset_env(args):
    api, repo, app_name = ctx(args)
    app_id = _app_id(api, app_name, args)
    step(f"Удаляю ENV: {', '.join(args.keys)} и жду передеплой")
    d = update_envs(api, app_id, {}, remove=tuple(args.keys))
    if d["status"] != "success":
        print("".join(app_logs(api, app_id)[-60:])[-4000:])
        die(f"Деплой после изменения ENV: {d['status']}")
    print("OK: переменные удалены, приложение перезапущено")


def _site_call(url: str, path: str, body: dict | None = None, token: str | None = None):
    """Запрос к API задеплоенного сайта. Возвращает (HTTP-код, JSON)."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        url + path,
        data=json.dumps(body).encode() if body is not None else b"",
        method="POST",
        headers=headers,
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except ValueError:
            return e.code, {}


def cmd_test_email(args):
    """Логинится админом (данные берёт из ENV приложения) и шлёт проверочное письмо."""
    api, repo, app_name = ctx(args)
    app = api.get(f"/apps/{_app_id(api, app_name, args)}")["app"]
    envs = app.get("envs") or {}
    url = f"https://{app_domain(app)}"
    if not (envs.get("SMTP_USER") and envs.get("SMTP_PASSWORD")):
        die("SMTP не настроен: нет SMTP_USER/SMTP_PASSWORD. Сначала set-env (см. SKILL.md, шаг 5).")
    step(f"Вхожу в {url} как {envs.get('ADMIN_EMAIL')}")
    code, data = _site_call(url, "/api/v1/auth/login", {
        "email": envs.get("ADMIN_EMAIL"), "password": envs.get("ADMIN_PASSWORD"),
    })
    if code != 200:
        die(f"Не удалось войти админом (HTTP {code}): {data}. Возможно, пароль админа меняли на сайте.")
    step(f"Отправляю проверочное письмо на {envs.get('ADMIN_EMAIL')} (до 30 секунд)")
    code, data = _site_call(url, "/api/v1/admin/email/test", token=data["access_token"])
    if code == 200:
        print(f"OK: {data.get('detail')}. Попросите человека проверить ящик и папку «Спам».")
        return
    detail = str(data.get("detail", data))
    print(f"\n[ОШИБКА SMTP] {detail}")
    if "Timeout" in detail or "timed out" in detail.lower():
        print(
            "Похоже, Timeweb закрыл исходящий почтовый порт. Попросите человека написать в поддержку\n"
            "Timeweb (текст в SKILL.md, шаг 5.1) и повторите test-email после ответа поддержки."
        )
    elif "Authentication" in detail or "535" in detail or "534" in detail:
        print("Почтовый сервер не принял логин/пароль. Нужен именно пароль приложения (SKILL.md, шаг 5.2).")
    sys.exit(1)


def cmd_status(args):
    api, repo, app_name = ctx(args)
    app_id = _app_id(api, app_name, args)
    app = api.get(f"/apps/{app_id}")["app"]
    ds = deploys(api, app_id)[:3]
    out = {
        "app_id": app_id, "status": app["status"], "url": f"https://{app_domain(app)}",
        "envs": sorted((app.get("envs") or {}).keys()),
        "deploys": [{k: d.get(k) for k in ("status", "started_at", "ended_at", "commit_msg")} for d in ds],
    }
    st = load_state(app_name)
    if st.get("db_id"):
        db = api.get(f"/databases/{st['db_id']}", ok404=True)
        out["db"] = db["db"]["status"] if db else "не найдена"
    print(json.dumps(out, ensure_ascii=False, indent=2))


def cmd_logs(args):
    api, repo, app_name = ctx(args)
    print("".join(app_logs(api, _app_id(api, app_name, args))[-args.n:]))


def cmd_redeploy(args):
    api, repo, app_name = ctx(args)
    app_id = _app_id(api, app_name, args)
    known = {d["id"] for d in deploys(api, app_id)}
    redeploy(api, app_id)
    d = wait_deploy(api, app_id, known_ids=known)
    print(f"Деплой: {d['status']}")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # кириллица в консоли Windows
        sys.stderr.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description="Деплой OpenSaaS в Timeweb Cloud App Platform")
    p.add_argument("--token", help="API-ключ Timeweb (лучше через env TIMEWEB_TOKEN)")
    p.add_argument("--repo", help="owner/name на GitHub (по умолчанию из git remote origin)")
    p.add_argument("--name", help="имя приложения в Timeweb (по умолчанию = имя репозитория)")
    p.add_argument("--branch", default="main")
    p.add_argument("--location", default=DEFAULT_LOCATION, help="ru-3 = Москва (по умолчанию)")
    p.add_argument("--app-id", type=int, dest="app_id")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("check").set_defaults(fn=cmd_check)
    sub.add_parser("plan").set_defaults(fn=cmd_plan)
    d = sub.add_parser("deploy")
    d.add_argument("--email", required=True, help="email администратора сайта")
    d.add_argument("--app-title", default="OpenSaaS", help="значение APP_NAME")
    d.add_argument("--yes", action="store_true", help="подтверждение, что человек согласился на оплату")
    d.set_defaults(fn=cmd_deploy)
    s = sub.add_parser("set-env")
    s.add_argument("pairs", nargs="+", metavar="KEY=VALUE")
    s.set_defaults(fn=cmd_set_env)
    u = sub.add_parser("unset-env")
    u.add_argument("keys", nargs="+", metavar="KEY")
    u.set_defaults(fn=cmd_unset_env)
    sub.add_parser("test-email").set_defaults(fn=cmd_test_email)
    sub.add_parser("status").set_defaults(fn=cmd_status)
    lg = sub.add_parser("logs")
    lg.add_argument("-n", type=int, default=80)
    lg.set_defaults(fn=cmd_logs)
    sub.add_parser("redeploy").set_defaults(fn=cmd_redeploy)

    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
