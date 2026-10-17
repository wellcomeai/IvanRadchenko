import { Check, CreditCard, Gift, LayoutDashboard, Shield, type LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/** «Всё уже написано»: bento-сетка с мини-интерфейсами вместо иконок-заглушек. */
export function WhatInside() {
  return (
    <section id="inside" className="lx-section lx-band">
      <div className="lx-container">
        <SectionHeading
          tag="Уже внутри"
          title={<>Всё уже <em>написано за вас</em></>}
          text="Месяцы работы программистов — уже в коде. Вам остаётся только своя идея."
        />

        <Stagger className="mt-16 grid grid-cols-1 md:grid-cols-6 gap-5">
          {/* Регистрация */}
          <StaggerItem className="lx-card lx-card-hover md:col-span-3 p-8 flex flex-col">
            <Head Icon={Shield} title="Регистрация пользователей" text="Регистрация, вход и защита от ботов работают сразу после деплоя. Никаких ключей и настроек." />
            <div className="mt-8 rounded-2xl bg-[var(--lx-ivory)] border border-[var(--lx-line)] p-5 space-y-3">
              <Field label="Email" value="anna@studio.ru" />
              <Field label="Пароль" value="••••••••••" mono />
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--lx-line)] bg-white px-3.5 py-2.5 text-[13px] text-[var(--lx-ink-2)]">
                <span className="flex h-4 w-4 items-center justify-center rounded-full text-white" style={{ background: "var(--lx-sage)" }}>
                  <Check size={10} strokeWidth={3.5} />
                </span>
                Проверка на робота пройдена
              </div>
              <div className="h-11 rounded-xl flex items-center justify-center text-[14px] font-semibold text-white" style={{ background: "var(--lx-ink)" }}>Создать аккаунт</div>
            </div>
          </StaggerItem>

          {/* Платежи */}
          <StaggerItem className="lx-card lx-card-hover md:col-span-3 p-8 flex flex-col">
            <Head Icon={CreditCard} title="Приём платежей" text="Подключи оплату за 5 минут — просто вставь ключи. История транзакций в админке." />
            <div className="mt-8 rounded-2xl bg-[var(--lx-ivory)] border border-[var(--lx-line)] divide-y divide-[var(--lx-line)]">
              {[
                { who: "Pro · anna@studio.ru", sum: "2 990 ₽" },
                { who: "Basic · ivan@mail.ru", sum: "990 ₽" },
                { who: "Pro · team@agency.ru", sum: "2 990 ₽" },
              ].map((r) => (
                <div key={r.who} className="flex items-center gap-3 px-5 py-3.5 text-[14px]">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#e3efe6] text-[var(--lx-sage)]"><Check size={13} strokeWidth={2.5} /></span>
                  <span className="text-[var(--lx-ink-2)] truncate">{r.who}</span>
                  <span className="ml-auto font-semibold tabular-nums">{r.sum}</span>
                </div>
              ))}
            </div>
          </StaggerItem>

          {/* Кабинет */}
          <StaggerItem className="lx-card lx-card-hover md:col-span-4 p-8 flex flex-col">
            <Head Icon={LayoutDashboard} title="Личный кабинет" text="Каждый пользователь видит свои данные, подписку и историю платежей." />
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { k: "Тариф", v: "Pro" },
                { k: "Продление", v: "12 окт" },
                { k: "Запросов", v: "∞" },
              ].map((c) => (
                <div key={c.k} className="rounded-2xl bg-[var(--lx-ivory)] border border-[var(--lx-line)] p-4">
                  <div className="text-[12px] text-[var(--lx-ink-3)]">{c.k}</div>
                  <div className="lx-display text-[24px] leading-none mt-2">{c.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-[var(--lx-ivory)] border border-[var(--lx-line)] p-4">
              <div className="flex justify-between text-[12px] text-[var(--lx-ink-3)] mb-2"><span>Использовано в этом месяце</span><span>68%</span></div>
              <div className="h-2 rounded-full bg-[var(--lx-line)] overflow-hidden"><div className="h-full rounded-full" style={{ width: "68%", background: "linear-gradient(90deg,var(--lx-clay),#e08a68)" }} /></div>
            </div>
          </StaggerItem>

          {/* Партнёрка */}
          <StaggerItem className="lx-card lx-card-hover md:col-span-2 p-8 flex flex-col">
            <Head Icon={Gift} title="Партнёрская программа" text="Пользователи приглашают друзей — платформа растёт сама." />
            <div className="mt-8 rounded-2xl p-5 flex-1 flex flex-col justify-end" style={{ background: "var(--lx-clay-soft)" }}>
              <div className="text-[12px] text-[var(--lx-clay-ink)]">Начислено партнёру</div>
              <div className="lx-display text-[36px] leading-none mt-2 text-[var(--lx-clay-ink)]">+598 ₽</div>
              <div className="text-[12.5px] text-[var(--lx-clay-ink)]/80 mt-2">20% с каждой оплаты друга</div>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

function Head({ Icon, title, text }: { Icon: LucideIcon; title: string; text: string }) {
  return (
    <div>
      <Icon size={22} strokeWidth={1.6} className="text-[var(--lx-clay)] mb-5" />
      <h3 className="text-[20px] mb-2">{title}</h3>
      <p className="text-[15px] text-[var(--lx-ink-2)] leading-relaxed max-w-[440px]">{text}</p>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-white border border-[var(--lx-line)] px-4 py-2.5">
      <div className="text-[11px] text-[var(--lx-ink-3)]">{label}</div>
      <div className={"text-[14.5px] text-[var(--lx-ink)] " + (mono ? "lx-mono tracking-wider" : "")}>{value}</div>
    </div>
  );
}
