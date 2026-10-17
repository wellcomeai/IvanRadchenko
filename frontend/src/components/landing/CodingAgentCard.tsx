import { ArrowUpRight, Wallet } from "lucide-react";
import { BrandIcon } from "./BrandIcon";
import { CopyButton } from "./CopyButton";
import { Reveal } from "./Reveal";
import { CODING_AGENT_DEPLOY_PRICE, CODING_AGENT_PROMPT, CODING_AGENT_URL } from "./site";

const steps = [
  { title: "Войдите через GitHub", text: "и выберите ветку своего проекта" },
  { title: `Пополните счёт на ${CODING_AGENT_DEPLOY_PRICE}`, text: "примерно столько агент тратит на деплой" },
  { title: "Отправьте одно сообщение", text: "агент сделает деплой и пришлёт ссылку на ваш сайт" },
];

/** Карточка CodingAgent: деплой без подписки на Claude Code / Codex, оплата в рублях. */
export function CodingAgentCard() {
  return (
    <Reveal>
      <div id="coding-agent" className="lx-card mt-10 p-6 sm:p-9 text-left scroll-mt-28" style={{ borderRadius: 28 }}>
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: "var(--lx-clay-soft)", color: "var(--lx-clay-ink)" }}>
              <Wallet size={13} /> Оплата в рублях
            </span>
            <h3 className="mt-4 text-[22px] sm:text-[26px] leading-tight text-[var(--lx-ink)]">
              Нет подписки на Claude Code или Codex?
            </h3>
            <p className="mt-3 text-[15.5px] leading-relaxed text-[var(--lx-ink-2)]">
              Используйте наш CodingAgent: не нужны зарубежная карта и подписка. Деплой обойдётся примерно
              в {CODING_AGENT_DEPLOY_PRICE}, а дальше с этим же агентом можно дорабатывать приложение под свои задачи.
            </p>

            <ol className="mt-6 space-y-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-3.5">
                  <span className="flex-none w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold text-white bg-[var(--lx-ink)]">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-[var(--lx-ink)]">{s.title}</span>
                    <span className="block text-[14px] text-[var(--lx-ink-3)]">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>

            <a href={CODING_AGENT_URL} target="_blank" rel="noopener noreferrer" className="lx-btn lx-btn-clay mt-7">
              <BrandIcon name="github" size={16} color="#fff" />
              Открыть CodingAgent
              <ArrowUpRight size={16} />
            </a>
            <p className="mt-3 text-[12.5px] text-[var(--lx-ink-3)]">
              Хостинг Timeweb (≈1 500 ₽/мес) оплачивается отдельно, напрямую Timeweb.
            </p>
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold text-[var(--lx-ink-2)]">Сообщение для агента</span>
              <CopyButton text={CODING_AGENT_PROMPT} />
            </div>
            <pre className="lx-mono mt-3 whitespace-pre-wrap break-words rounded-2xl bg-[var(--lx-ink)] text-white/85 text-[13px] leading-relaxed p-5 m-0">
              {CODING_AGENT_PROMPT}
            </pre>
            <p className="mt-3 text-[12.5px] text-[var(--lx-ink-3)]">
              Замените <span className="lx-mono text-[var(--lx-ink-2)]">ваш@email.com</span> на свою почту. Если не меняли
              ветку — оставьте <span className="lx-mono text-[var(--lx-ink-2)]">main</span>.
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
