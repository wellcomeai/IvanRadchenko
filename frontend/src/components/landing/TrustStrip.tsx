import { BrandIcon } from "./BrandIcon";
import type { BrandKey } from "./brand-icons-data";

const items: { key: BrandKey; label: string; color?: string }[] = [
  { key: "claudecode", label: "Claude Code" },
  { key: "openai", label: "Codex", color: "#16140f" },
  { key: "cursor", label: "Cursor", color: "#16140f" },
  { key: "gemini", label: "Gemini CLI" },
  { key: "github", label: "GitHub", color: "#16140f" },
  { key: "nextjs", label: "Next.js", color: "#16140f" },
  { key: "react", label: "React" },
  { key: "typescript", label: "TypeScript" },
  { key: "tailwind", label: "Tailwind" },
  { key: "python", label: "Python" },
  { key: "fastapi", label: "FastAPI" },
  { key: "postgresql", label: "PostgreSQL" },
  { key: "docker", label: "Docker" },
];

/** Бегущая лента: AI-агенты и проверенный стек. */
export function TrustStrip() {
  return (
    <section className="relative" aria-label="Совместимость">
      <div className="lx-container py-7 flex flex-col md:flex-row md:items-center gap-5 md:gap-10">
        <div className="text-[12px] font-semibold tracking-[0.16em] uppercase text-[var(--lx-ink-3)] md:w-[180px] flex-none leading-relaxed">
          Любой AI-агент.
          <br className="hidden md:block" /> Проверенный стек.
        </div>
        <div className="lx-marquee-wrap lx-fade-x overflow-hidden flex-1">
          <div className="lx-marquee">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center gap-12 pr-12" aria-hidden={copy === 1}>
                {items.map((it) => (
                  <span key={it.label} className="inline-flex items-center gap-2.5 text-[15px] font-medium text-[var(--lx-ink-2)] whitespace-nowrap">
                    <BrandIcon name={it.key} size={22} color={it.color} />
                    {it.label}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
