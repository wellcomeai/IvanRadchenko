import { ArrowUpRight } from "lucide-react";
import { BrandIcon } from "./BrandIcon";
import { PromptLine } from "./CopyButton";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { DEPLOY_PROMPT, DEPLOY_SKILL_URL, GITHUB_URL, TIMEWEB_URL } from "./site";

export function HowToStartSection() {
  return (
    <section id="how-to-start" className="lx-section lx-band">
      <div className="lx-container">
        <SectionHeading
          tag="Как начать · 3 шага"
          title={<>Вы даёте ключ — <em>агент делает остальное</em></>}
          text="Никаких серверов, консолей и настройки вручную. Инструкция для агента уже лежит в репозитории — он её прочитает сам."
        />

        <Stagger className="mt-16 grid md:grid-cols-3 gap-5 relative">
          <StaggerItem className="lx-card lx-card-hover p-8 flex flex-col">
            <StepNum n={1} />
            <h3 className="text-[19px] mb-3">Скопируйте репозиторий</h3>
            <p className="text-[15px] text-[var(--lx-ink-2)] leading-relaxed mb-7 flex-1">
              Нажмите «Fork» на GitHub — у вас появится собственная копия проекта. Код полностью ваш.
            </p>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[14px] font-semibold lx-link self-start">
              <BrandIcon name="github" size={16} color="currentColor" /> Открыть на GitHub <ArrowUpRight size={15} />
            </a>
          </StaggerItem>

          <StaggerItem className="lx-card lx-card-hover p-8 flex flex-col">
            <StepNum n={2} />
            <h3 className="text-[19px] mb-3">Подключите агента</h3>
            <p className="text-[15px] text-[var(--lx-ink-2)] leading-relaxed mb-7 flex-1">
              Откройте свою копию в Claude Code (claude.ai/code) или Codex. Подойдёт и Cursor — агент сам найдёт инструкции в AGENTS.md.
            </p>
            <div className="flex items-center gap-3">
              {(["claudecode", "openai", "cursor", "gemini"] as const).map((k) => (
                <span key={k} className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--lx-ivory)] border border-[var(--lx-line)]">
                  <BrandIcon name={k} size={20} color={k === "openai" || k === "cursor" ? "#16140f" : undefined} />
                </span>
              ))}
            </div>
          </StaggerItem>

          <StaggerItem className="lx-card lx-card-hover p-8 flex flex-col" >
            <StepNum n={3} accent />
            <h3 className="text-[19px] mb-3">Отправьте ключ Timeweb</h3>
            <p className="text-[15px] text-[var(--lx-ink-2)] leading-relaxed mb-7 flex-1">
              Создайте API-ключ в{" "}
              <a href={TIMEWEB_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--lx-clay-ink)] underline decoration-[var(--lx-clay)]/40 underline-offset-4">Timeweb Cloud</a>{" "}
              и напишите агенту одну фразу. Через 10–15 минут у вас будет ссылка и пароль админа.
            </p>
            <a href={DEPLOY_SKILL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[14px] font-semibold lx-link self-start">
              Посмотреть, что делает агент <ArrowUpRight size={15} />
            </a>
          </StaggerItem>
        </Stagger>

        <Reveal className="mt-10 mx-auto" >
          <div className="mx-auto" style={{ maxWidth: 680 }}>
            <PromptLine text={DEPLOY_PROMPT} />
            <p className="text-center text-[13.5px] text-[var(--lx-ink-3)] mt-4">
              Перед созданием серверов агент покажет цену и спросит согласие. Ключ никуда не сохраняется.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StepNum({ n, accent = false }: { n: number; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <span
        className="lx-display w-12 h-12 rounded-full flex items-center justify-center text-[18px]"
        style={{
          background: accent ? "var(--lx-clay)" : "var(--lx-ivory)",
          color: accent ? "#fff" : "var(--lx-ink)",
          border: accent ? "none" : "1px solid var(--lx-line-2)",
        }}
      >
        {n}
      </span>
      <span className="h-px flex-1 bg-[var(--lx-line-2)]" />
    </div>
  );
}
