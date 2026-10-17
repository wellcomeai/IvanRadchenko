/**
 * Общие данные лендинга: ссылки и тексты промптов.
 * Меняйте здесь — они используются сразу в нескольких секциях.
 */

export const GITHUB_URL = "https://github.com/SturtapHab/OpenSaas";
export const SKILL_URL = `${GITHUB_URL}/tree/main/.claude/skills`;
export const DEPLOY_SKILL_URL = `${GITHUB_URL}/tree/main/.claude/skills/deploy-timeweb`;
export const MENTOR_SKILL_URL = `${GITHUB_URL}/tree/main/.claude/skills/opensaas-mentor`;
export const AUTHOR_URL = "https://t.me/wellcome_ai";
export const TIMEWEB_URL = "https://timeweb.cloud";

/** Куда ведут кнопки «Купить курс»: тарифы → регистрация → оплата через Робокассу. */
export const COURSE_URL = "/pricing";
export const COURSE_PRICE = "3000 ₽";

/** Ссылка на видео. Пока пусто — показываем плашку «Видео скоро». */
export const VIDEO_URL = "";

export const DEPLOY_PROMPT = "Вот мой ключ от Timeweb — задеплой сервис: <ключ>";
export const EXPLAIN_PROMPT = "Объясни, как работает этот проект";

/** Наш CodingAgent — для тех, у кого нет подписки на Claude Code или Codex. Оплата в рублях. */
export const CODING_AGENT_URL = "https://77-232-135-253.sslip.io";
export const CODING_AGENT_DEPLOY_PRICE = "200 ₽";
export const CODING_AGENT_PROMPT = `Задеплой проект в Timeweb строго по DEPLOY.md.

Ветка: main
Почта администратора сайта: ваш@email.com
Расходы подтверждаю (~1500 ₽/мес, почасово), спрашивать согласие не нужно.
Создай новое приложение и новую базу с уникальным именем.

После деплоя пришли ссылку на сайт, логин и пароль админа и App ID.`;
