import { Eye, Lock, Scale, Wallet } from "lucide-react";
import { BrandIcon } from "./BrandIcon";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { GITHUB_URL, SKILL_URL } from "./site";

const tree: { depth: number; name: string; note?: string; hl?: boolean }[] = [
  { depth: 0, name: "OpenSaas/" },
  { depth: 1, name: "AGENTS.md", note: "инструкции для любого агента", hl: true },
  { depth: 1, name: ".claude/skills/" },
  { depth: 2, name: "deploy-timeweb/", note: "деплой по одному ключу", hl: true },
  { depth: 2, name: "opensaas-mentor/", note: "агент-наставник", hl: true },
  { depth: 1, name: "backend/", note: "FastAPI · оплата, auth, API" },
  { depth: 1, name: "frontend/", note: "Next.js · сайт и кабинет" },
  { depth: 1, name: "docs/", note: "документация на русском" },
  { depth: 1, name: "LICENSE", note: "MIT" },
];

const facts = [
  { Icon: Scale, title: "Лицензия MIT", text: "Используйте в коммерческих проектах, меняйте, продавайте — без отчислений." },
  { Icon: Eye, title: "Весь код открыт", text: "Каждая строка на GitHub. Можно проверить, что внутри нет ничего лишнего." },
  { Icon: Lock, title: "Ваш сервер, ваши данные", text: "Сервис разворачивается в вашем аккаунте Timeweb. Доступ есть только у вас." },
  { Icon: Wallet, title: "Платите только хостингу", text: "Около 1 500 ₽ в месяц напрямую Timeweb. Нам — ничего, шаблон бесплатный." },
];

export function OpenSourceSection() {
  return (
    <section id="open-source" className="lx-section lx-band">
      <div className="lx-container grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-16 items-center">
        <div className="min-w-0">
          <SectionHeading
            align="left"
            tag="Полностью open source"
            title={<>Никакой магии. <em>Всё открыто</em> и проверяемо</>}
            text="Навыки агента — это обычные текстовые инструкции в репозитории. Скачайте их и отдайте любому агенту: Claude Code, Codex, Cursor или Gemini."
          />
          <Stagger className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-7">
            {facts.map(({ Icon, title, text }) => (
              <StaggerItem key={title}>
                <div className="flex items-center gap-2.5 mb-2">
                  <Icon size={18} className="text-[var(--lx-clay)]" strokeWidth={1.75} />
                  <span className="font-semibold text-[16px]">{title}</span>
                </div>
                <p className="text-[14.5px] text-[var(--lx-ink-2)] leading-relaxed">{text}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-10 flex flex-wrap gap-3">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="lx-btn lx-btn-ink">
              <BrandIcon name="github" size={17} color="#fff" /> Репозиторий
            </a>
            <a href={SKILL_URL} target="_blank" rel="noopener noreferrer" className="lx-btn lx-btn-ghost">
              Скачать skills
            </a>
          </Reveal>
        </div>

        {/* Дерево репозитория — в стиле «бумажного» окна GitHub */}
        <Reveal delay={0.1} className="min-w-0">
          <div className="lx-card overflow-hidden" style={{ borderRadius: 28, boxShadow: "var(--lx-shadow-lg)" }}>
            <div className="flex items-center gap-2.5 px-6 h-14 border-b border-[var(--lx-line)] bg-[var(--lx-ivory)]">
              <BrandIcon name="github" size={17} color="#16140f" />
              <span className="lx-mono text-[13px] text-[var(--lx-ink-2)]">SturtapHab / <b className="text-[var(--lx-ink)]">OpenSaas</b></span>
              <span className="ml-auto text-[11.5px] rounded-full px-2.5 py-0.5 border border-[var(--lx-line-2)] text-[var(--lx-ink-3)]">Public</span>
            </div>
            <div className="p-6 lx-mono text-[13.5px] leading-[2.1]">
              {tree.map((r) => (
                <div key={r.name} className="flex items-center gap-3" style={{ paddingLeft: r.depth * 22 }}>
                  <span className={"whitespace-nowrap " + (r.hl ? "text-[var(--lx-clay-ink)] font-medium" : r.name.endsWith("/") ? "text-[var(--lx-ink)]" : "text-[var(--lx-ink-2)]")}>{r.name}</span>
                  {r.note && <span className="hidden sm:inline text-[var(--lx-ink-3)] text-[12.5px] truncate"># {r.note}</span>}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
