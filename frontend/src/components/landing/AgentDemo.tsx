"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { BrandIcon } from "./BrandIcon";

type Agent = "claude" | "codex";

type Step =
  | { kind: "user"; text: string; secret?: string }
  | { kind: "agent"; text: string }
  | { kind: "ok"; text: string; meta?: string }
  | { kind: "result" };

const script: Step[] = [
  { kind: "user", text: "Вот мой ключ от Timeweb — задеплой сервис", secret: "eyJhbGci••••" },
  { kind: "agent", text: "Нашёл в репозитории skill deploy-timeweb. Проверяю ключ и GitHub…" },
  { kind: "ok", text: "Ключ рабочий, баланс 2 450 ₽" },
  { kind: "ok", text: "GitHub подключён, репозиторий виден" },
  { kind: "agent", text: "Будет создано: база + приложение ≈ 1 500 ₽/мес. Продолжаем? На какой email сделать админа?" },
  { kind: "user", text: "Да, admin@my-saas.ru" },
  { kind: "ok", text: "PostgreSQL создана", meta: "6 мин" },
  { kind: "ok", text: "Приложение собрано из Dockerfile", meta: "4 мин" },
  { kind: "ok", text: "Сайт отвечает, /health → 200", meta: "10 с" },
  { kind: "result" },
];

const DELAYS = [400, 1300, 900, 700, 1300, 1500, 1200, 1100, 1000, 1100];

const agents: Record<Agent, { label: string; cmd: string; accent: string }> = {
  claude: { label: "Claude Code", cmd: "claude", accent: "#E08A68" },
  codex: { label: "Codex", cmd: "codex", accent: "#9DB4FF" },
};

export function AgentDemo() {
  const [agent, setAgent] = useState<Agent>("claude");
  const [shown, setShown] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  // Сценарий проигрывается заново каждый раз, когда окно появляется на экране.
  const inView = useInView(ref, { amount: 0.3 });

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!inView) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(script.length);
      return;
    }

    setShown(0);
    let t = 0;
    DELAYS.forEach((d, i) => {
      t += d;
      timers.current.push(setTimeout(() => setShown(i + 1), t));
    });
    // Повторяем сценарий по кругу, переключая агента
    timers.current.push(setTimeout(() => setAgent((a) => (a === "claude" ? "codex" : "claude")), t + 7000));

    return () => timers.current.forEach(clearTimeout);
  }, [agent, inView]);

  const a = agents[agent];

  return (
    <div
      ref={ref}
      className="relative text-left"
      style={{
        borderRadius: 22,
        background: "linear-gradient(180deg,#1c1a15 0%,#14120e 100%)",
        border: "1px solid rgba(22,20,15,0.9)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 50px 100px -30px rgba(22,20,15,0.45), 0 20px 40px -20px rgba(22,20,15,0.3)",
        overflow: "hidden",
      }}
    >
      {/* Шапка окна + переключатель агента */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-white/15" />
          <span className="w-3 h-3 rounded-full bg-white/15" />
          <span className="w-3 h-3 rounded-full bg-white/15" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="inline-flex p-0.5 rounded-full bg-white/[0.06]" role="tablist" aria-label="Агент">
            {(Object.keys(agents) as Agent[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={agent === key}
                onClick={() => setAgent(key)}
                className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-[12px] font-medium transition-colors"
                style={{
                  background: agent === key ? "rgba(255,255,255,0.12)" : "transparent",
                  color: agent === key ? "#fff" : "rgba(255,255,255,0.5)",
                }}
              >
                <BrandIcon name={key === "claude" ? "claude" : "openai"} size={13} color={agent === key ? (key === "claude" ? "#D97757" : "#fff") : "rgba(255,255,255,0.5)"} />
                {agents[key].label}
              </button>
            ))}
          </div>
        </div>
        <span className="hidden sm:block lx-mono text-[11px] text-white/35">~/my-saas</span>
      </div>

      {/* Тело */}
      <div className="px-5 sm:px-6 py-5 lx-mono text-[12.5px] sm:text-[13px] leading-relaxed space-y-2.5" style={{ minHeight: 500 }}>
        <div className="text-white/35">
          $ <span className="text-white/70">{a.cmd}</span>
        </div>

        {script.slice(0, shown).map((s, i) => {
          if (s.kind === "user")
            return (
              <div key={`${agent}-${i}`} className="animate-fade-in flex gap-2">
                <span style={{ color: a.accent }}>&gt;</span>
                <span className="text-white">
                  {s.text}
                  {s.secret && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[12px] break-all">{s.secret}</span>
                  )}
                </span>
              </div>
            );
          if (s.kind === "agent")
            return (
              <div key={`${agent}-${i}`} className="animate-fade-in flex gap-2 text-white/75 text-[13.5px]" style={{ fontFamily: "Onest, sans-serif" }}>
                <span className="mt-[6px] w-2 h-2 rounded-full flex-none" style={{ background: a.accent }} />
                <span>{s.text}</span>
              </div>
            );
          if (s.kind === "ok")
            return (
              <div key={`${agent}-${i}`} className="animate-fade-in flex items-center gap-2 pl-4">
                <span className="text-[#8fc7a0]">✓</span>
                <span className="text-white/80">{s.text}</span>
                {s.meta && <span className="ml-auto text-white/30 text-[11px]">{s.meta}</span>}
              </div>
            );
          return (
            <div
              key={`${agent}-${i}`}
              className="animate-fade-up mt-3 rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg, rgba(143,199,160,0.14), rgba(224,138,104,0.12))", border: "1px solid rgba(143,199,160,0.28)", fontFamily: "Onest, sans-serif" }}
            >
              <div className="text-[#a9d8b6] font-semibold text-[14px] mb-2">Сайт работает — за 10 минут</div>
              <div className="lx-mono text-[12.5px] space-y-1 text-white/85">
                <div><span className="text-white/40">сайт:   </span>https://my-saas.twc1.net</div>
                <div><span className="text-white/40">логин:  </span>admin@my-saas.ru</div>
                <div><span className="text-white/40">пароль: </span>••••••••••••</div>
              </div>
            </div>
          );
        })}

        {shown < script.length && (
          <span className="inline-block w-2 h-4 bg-white/60 animate-blink" style={{ verticalAlign: "text-bottom" }} />
        )}
      </div>
    </div>
  );
}
