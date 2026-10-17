"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CreditCard, Database, PlayCircle, Users } from "lucide-react";
import { AgentDemo } from "./AgentDemo";
import { CodingAgentCard } from "./CodingAgentCard";
import { BrandIcon } from "./BrandIcon";
import { Reveal } from "./Reveal";
import { CODING_AGENT_DEPLOY_PRICE, GITHUB_URL } from "./site";

const stats = [
  { value: "15 мин", label: "от ключа до работающего сайта" },
  { value: "0 ₽", label: "за шаблон — лицензия MIT" },
  { value: "≈1 500 ₽", label: "в месяц за хостинг, напрямую Timeweb" },
  { value: "100%", label: "кода открыто на GitHub" },
];

export function Hero() {
  const stage = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stage, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.45], [0.94, 1]);
  const floatL = useTransform(scrollYProgress, [0, 1], [40, -60]);
  const floatR = useTransform(scrollYProgress, [0, 1], [70, -40]);

  return (
    <section className="relative overflow-hidden lx-grain" style={{ paddingTop: 136 }}>
      {/* Фон: мягкое тёплое свечение и тонкая сетка */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, #fff 0%, rgba(255,255,255,0) 70%)" }} />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[900px] lx-grid-lines pointer-events-none" style={{ maskImage: "radial-gradient(ellipse 60% 55% at 50% 30%, #000 10%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 30%, #000 10%, transparent 75%)", opacity: 0.6 }} />
      <div aria-hidden className="absolute pointer-events-none" style={{ width: 720, height: 720, top: 260, left: "50%", transform: "translateX(-50%)", borderRadius: "50%", filter: "blur(90px)", background: "radial-gradient(circle, rgba(224,138,104,0.28) 0%, rgba(224,138,104,0) 65%)" }} />

      <div className="relative lx-container text-center">
        <Reveal>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-white/80 backdrop-blur pl-1.5 pr-4 py-1.5 text-[13px] text-[var(--lx-ink-2)] no-underline border border-[var(--lx-line)] hover:border-[var(--lx-line-2)] transition-colors"
            style={{ boxShadow: "var(--lx-shadow)" }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lx-ink)] text-white px-2.5 py-1 text-[11px] font-semibold">
              <BrandIcon name="github" size={11} color="#fff" /> MIT
            </span>
            <span>100% open source<span className="hidden sm:inline"> · бесплатно навсегда</span></span>
            <ArrowRight size={14} className="text-[var(--lx-ink-3)]" />
          </a>
        </Reveal>

        <Reveal delay={0.08}>
          <h1
            className="lx-display mx-auto mt-8"
            style={{ fontSize: "clamp(2.1rem, 5vw, 4.25rem)", lineHeight: 1.05, maxWidth: 1080 }}
          >
            Свой <span className="whitespace-nowrap">онлайн-бизнес</span> <em className="whitespace-nowrap">за 15 минут</em>
            <br className="hidden sm:block" /> одним сообщением ИИ-агенту
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mx-auto mt-5 text-[15px] leading-relaxed text-[var(--lx-ink-3)]" style={{ maxWidth: 560 }}>
            Это сайт, где клиенты регистрируются и платят за доступ, как в Notion или Тильде.
            Такие сервисы называют SaaS.
          </p>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="lx-lead mx-auto mt-7" style={{ maxWidth: 640, fontSize: 19 }}>
            Скопируйте репозиторий, откройте его в Claude Code или Codex и напишите{" "}
            <span className="lx-mono text-[15px] text-[var(--lx-ink)] bg-white border border-[var(--lx-line)] rounded-md px-1.5 py-0.5 whitespace-nowrap">
              «вот ключ Timeweb — задеплой»
            </span>
            . Агент сам создаст базу, соберёт приложение и выдаст ссылку с паролем админа.
          </p>
          <p className="mx-auto mt-4 text-[15px] text-[var(--lx-ink-3)]">
            Нет подписки?{" "}
            <a href="#coding-agent" className="font-semibold text-[var(--lx-clay-ink)] underline underline-offset-4 decoration-[var(--lx-clay-soft)] hover:decoration-[var(--lx-clay)]">
              Задеплойте через наш CodingAgent
            </a>{" "}
            с оплатой в рублях — около {CODING_AGENT_DEPLOY_PRICE} →
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="lx-btn lx-btn-ink">
              <BrandIcon name="github" size={17} color="#fff" />
              Забрать код на GitHub
            </a>
            <a href="#video" className="lx-btn lx-btn-ghost">
              <PlayCircle size={17} />
              Как запустить за 10 минут
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.32}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[13px] text-[var(--lx-ink-3)]">
            <span>Работает с</span>
            <span className="inline-flex items-center gap-2 text-[var(--lx-ink-2)] font-medium"><BrandIcon name="claude" size={18} /> Claude Code</span>
            <span className="inline-flex items-center gap-2 text-[var(--lx-ink-2)] font-medium"><BrandIcon name="openai" size={17} color="#16140f" /> Codex</span>
            <span className="inline-flex items-center gap-2 text-[var(--lx-ink-2)] font-medium"><BrandIcon name="cursor" size={16} color="#16140f" /> Cursor</span>
            <span className="inline-flex items-center gap-2 text-[var(--lx-ink-2)] font-medium"><BrandIcon name="gemini" size={17} /> Gemini CLI</span>
          </div>
        </Reveal>
      </div>

      {/* Сцена с демо агента */}
      <div ref={stage} className="relative lx-container mt-20">
        <motion.div style={{ scale }} className="relative mx-auto">
          <div className="relative mx-auto" style={{ maxWidth: 860 }}>
            <AgentDemo />

            {/* Плавающие карточки результата */}
            <motion.div style={{ y: floatL }} className="hidden lg:block absolute -left-[262px] top-[70px]">
              <FloatCard icon={<Database size={16} />} title="PostgreSQL" text="создана и подключена" />
            </motion.div>
            <motion.div style={{ y: floatR }} className="hidden lg:block absolute -right-[262px] top-[200px]">
              <FloatCard icon={<CreditCard size={16} />} title="+ 990 ₽" text="оплата через Робокассу" accent />
            </motion.div>
            <motion.div style={{ y: floatL }} className="hidden lg:block absolute -left-[262px] bottom-[110px]">
              <FloatCard icon={<Users size={16} />} title="Новый пользователь" text="зарегистрировался" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Цифры */}
      <div className="relative lx-container mt-24 pb-24">
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-[var(--lx-line-2)]">
          {stats.map((s, i) => (
            <Reveal key={s.value} delay={i * 0.06} className={"pt-8 pb-2 px-2 lg:px-6 " + (i > 0 ? "lg:border-l border-[var(--lx-line)]" : "")}>
              <div className="lx-display text-[var(--lx-ink)]" style={{ fontSize: "clamp(1.75rem, 2.8vw, 2.5rem)", lineHeight: 1 }}>{s.value}</div>
              <div className="mt-3 text-[14px] leading-snug text-[var(--lx-ink-3)] max-w-[220px]">{s.label}</div>
            </Reveal>
          ))}
        </div>

        <CodingAgentCard />
      </div>
    </section>
  );
}

function FloatCard({ icon, title, text, accent = false }: { icon: React.ReactNode; title: string; text: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur px-4 py-3 border border-[var(--lx-line)]" style={{ boxShadow: "var(--lx-shadow-lg)", width: 230 }}>
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
        style={{ background: accent ? "var(--lx-clay-soft)" : "var(--lx-sand)", color: accent ? "var(--lx-clay-ink)" : "var(--lx-ink-2)" }}
      >
        {icon}
      </span>
      <span className="text-left">
        <span className="block text-[14px] font-semibold text-[var(--lx-ink)]">{title}</span>
        <span className="block text-[12.5px] text-[var(--lx-ink-3)]">{text}</span>
      </span>
    </div>
  );
}
