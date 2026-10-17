"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { GITHUB_URL } from "./site";

const faqs = [
  {
    q: "Это правда бесплатно?",
    a: "Да. Код открыт под лицензией MIT: скачивайте, меняйте, запускайте коммерческие проекты. Платите только за хостинг — около 1 500 ₽ в месяц напрямую Timeweb Cloud. Платный только курс по развитию сервиса, и он необязателен.",
  },
  {
    q: "Мне нужно уметь программировать?",
    a: "Нет. Деплой делает AI-агент по готовой инструкции из репозитория. А встроенный агент-наставник объяснит простыми словами, как всё устроено, и поможет с доработками по шагам.",
  },
  {
    q: "Какие агенты подходят?",
    a: "Claude Code и Codex — основные. Также Cursor, Gemini CLI и другие агенты, которые читают AGENTS.md и папку .claude/skills.",
  },
  {
    q: "Безопасно ли отправлять агенту ключ Timeweb?",
    a: "Агент передаёт ключ только в скрипт деплоя и не сохраняет его в файлы. Перед созданием серверов он показывает цену и ждёт вашего согласия. После деплоя ключ лучше удалить в панели Timeweb и при необходимости выпустить новый.",
  },
  {
    q: "Что входит в шаблон?",
    a: "Регистрация и вход с защитой от ботов, биллинг (Робокасса), пробный период, реферальная программа, API-ключи, личный кабинет и админка. Backend на FastAPI, frontend на Next.js 14.",
  },
  {
    q: "Можно ли подключить Stripe?",
    a: "В шаблоне есть заготовка stripe.py с TODO и точками подключения в webhook. Документация Stripe + аналогичный код Робокассы — и Stripe заработает.",
  },
  {
    q: "Какая лицензия?",
    a: "MIT. Используйте в коммерческих и личных проектах без ограничений и отчислений.",
  },
  {
    q: "Как добавить свой модуль?",
    a: "Создайте папку backend/modules/<name>/ с моделью, схемой и сервисом, добавьте миграцию Alembic и роутер. Каждый модуль изолирован — можно писать с помощью AI-агентов.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="lx-section">
      <div className="lx-container grid lg:grid-cols-[1fr_1.5fr] gap-14">
        <div className="lg:sticky lg:top-32 self-start">
          <SectionHeading
            align="left"
            tag="FAQ"
            title={<>Частые <em>вопросы</em></>}
            text={
              <>
                Если ответа нет — пишите в{" "}
                <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer" className="lx-link font-medium">GitHub Issues</a>
              </>
            }
          />
        </div>

        <Reveal delay={0.08}>
          <div className="border-t border-[var(--lx-line-2)]">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="border-b border-[var(--lx-line-2)]">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-6 py-6 text-left group"
                  >
                    <span className="text-[18px] font-medium tracking-tight group-hover:text-[var(--lx-clay-ink)] transition-colors">{f.q}</span>
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-none border transition-all duration-300"
                      style={{
                        background: isOpen ? "var(--lx-ink)" : "transparent",
                        borderColor: isOpen ? "var(--lx-ink)" : "var(--lx-line-2)",
                        color: isOpen ? "#fff" : "var(--lx-ink)",
                        transform: isOpen ? "rotate(45deg)" : "none",
                      }}
                    >
                      <Plus size={16} strokeWidth={2} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pr-14 text-[15.5px] leading-relaxed text-[var(--lx-ink-2)]">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
