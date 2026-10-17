import { ArrowUpRight, Brain, Lightbulb, ListChecks, MessageCircleQuestion } from "lucide-react";
import { BrandIcon } from "./BrandIcon";
import { PromptLine } from "./CopyButton";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { EXPLAIN_PROMPT, MENTOR_SKILL_URL } from "./site";

const points = [
  { Icon: MessageCircleQuestion, title: "Объясняет простыми словами", text: "Без жаргона: что такое бэкенд, база, вебхук — через понятные аналогии." },
  { Icon: Lightbulb, title: "Подсказывает идеи", text: "Какие сервисы можно построить на этом шаблоне именно под вашу задачу." },
  { Icon: ListChecks, title: "Ведёт по шагам", text: "Хотите доработку — разобьёт на маленькие шаги и сделает вместе с вами." },
  { Icon: Brain, title: "Вы понимаете, что делаете", text: "Не жмёте кнопки вслепую: перед каждым изменением агент объясняет, зачем оно." },
];

export function MentorAgentSection() {
  return (
    <section id="mentor" className="lx-section overflow-hidden">
      <div aria-hidden className="absolute pointer-events-none" style={{ width: 640, height: 640, top: 80, right: -160, borderRadius: "50%", filter: "blur(90px)", background: "radial-gradient(circle, rgba(224,138,104,0.22) 0%, transparent 65%)" }} />

      <div className="relative lx-container grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-16 items-center">
        <div className="min-w-0">
          <SectionHeading
            align="left"
            tag="Встроенный наставник"
            title={<>В проект встроен агент, <em>который учит</em></>}
            text="Скопировали репозиторий, открыли в Claude Code или Codex — и просто спросите. Включится агент-наставник: расскажет, как устроен ваш сервис, для чего каждая часть и что на нём можно построить."
          />

          <Stagger className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-7">
            {points.map(({ Icon, title, text }) => (
              <StaggerItem key={title}>
                <Icon size={20} className="text-[var(--lx-clay)] mb-3" strokeWidth={1.75} />
                <div className="font-semibold text-[16px] mb-1.5">{title}</div>
                <div className="text-[14.5px] text-[var(--lx-ink-2)] leading-relaxed">{text}</div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal className="mt-10 max-w-md">
            <PromptLine text={EXPLAIN_PROMPT} />
            <a href={MENTOR_SKILL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-[13.5px] text-[var(--lx-ink-3)] hover:text-[var(--lx-ink)] no-underline transition-colors">
              Инструкция наставника открыта — можно почитать <ArrowUpRight size={14} />
            </a>
          </Reveal>
        </div>

        {/* Диалог с наставником в Claude Code */}
        <Reveal delay={0.1} className="min-w-0">
          <div className="lx-card overflow-hidden" style={{ boxShadow: "var(--lx-shadow-lg)", borderRadius: 28 }}>
            <div className="flex items-center gap-2.5 px-6 h-14 border-b border-[var(--lx-line)] bg-[var(--lx-ivory)]">
              <BrandIcon name="claudecode" size={18} />
              <span className="text-[14px] font-semibold">Наставник OpenSaaS</span>
              <span className="ml-auto inline-flex items-center gap-2 text-[12px] text-[var(--lx-ink-3)]">
                <span className="lx-live-dot" /> Claude Code
              </span>
            </div>
            <div className="p-6 sm:p-8 space-y-6 text-[15px] leading-relaxed">
              <div className="flex justify-end">
                <div className="rounded-[20px] rounded-br-md px-4 py-2.5 text-white max-w-[85%]" style={{ background: "var(--lx-ink)" }}>
                  Объясни, как работает этот проект
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-8 h-8 rounded-full flex items-center justify-center flex-none bg-[var(--lx-clay-soft)]">
                  <BrandIcon name="claude" size={16} />
                </span>
                <div className="text-[var(--lx-ink-2)] space-y-3 min-w-0">
                  <p>
                    Представьте <b className="text-[var(--lx-ink)]">кафе</b>. Зал с меню, где сидят гости, — это <Hl>фронтенд</Hl>: страницы, которые видит пользователь.
                  </p>
                  <p>
                    Кухня, где готовят заказы, — <Hl>бэкенд</Hl>. Он проверяет пароли, считает подписки, принимает оплату.
                  </p>
                  <p>
                    Склад продуктов — <Hl>база данных</Hl>: там хранятся пользователи и платежи. А <Hl>Робокасса</Hl> — кассовый терминал, который приносит деньги прямо в ваш ресторан.
                  </p>
                  <p className="text-[var(--lx-ink-3)]">Хотите, покажу это на вашем сайте: что происходит, когда человек нажимает «Зарегистрироваться»?</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-11">
                {["Да, покажи", "Что можно построить?", "Хочу добавить свою функцию"].map((c) => (
                  <span key={c} className="rounded-full border border-[var(--lx-line-2)] px-3.5 py-1.5 text-[13px] text-[var(--lx-ink-2)] bg-white">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Hl({ children }: { children: React.ReactNode }) {
  return <b className="font-semibold text-[var(--lx-clay-ink)] bg-[var(--lx-clay-soft)] rounded px-1">{children}</b>;
}
