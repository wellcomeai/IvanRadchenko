"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpenCheck,
  CircleDollarSign,
  GraduationCap,
  LineChart,
  PiggyBank,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { courseApi } from "@/api/course";
import { useHasSession } from "@/hooks/useHasSession";
import { lessonsWord } from "@/components/course/plural";
import type { ProgramModule } from "@/types";

/** Пока программа грузится с сервера (или если он недоступен) — показываем стартовую. */
const FALLBACK_PROGRAM: ProgramModule[] = [
  { position: 1, title: "Финансовое мышление", description: "Как работают деньги и почему одни люди богатеют, а другие нет. Ставим личные финансовые цели.", lesson_count: 0 },
  { position: 2, title: "Личный бюджет и учёт", description: "Доходы, расходы и куда на самом деле уходят деньги. Финансовый план и привычка откладывать.", lesson_count: 0 },
  { position: 3, title: "Подушка безопасности и долги", description: "Резерв на чёрный день, кредиты без ловушек и как выбраться из долгов.", lesson_count: 0 },
  { position: 4, title: "Основы инвестирования", description: "Инфляция, сложный процент, вклады, облигации, акции и фонды — с чего начать.", lesson_count: 0 },
  { position: 5, title: "Защита капитала", description: "Страхование, налоги и вычеты, защита от финансового мошенничества.", lesson_count: 0 },
  { position: 6, title: "Путь к финансовой независимости", description: "Пассивный доход, своя пенсия и личная стратегия на годы вперёд.", lesson_count: 0 },
];

const STEPS = [
  { icon: UserPlus, title: "Регистрируйтесь", text: "Минута на создание аккаунта — и все открытые уроки сразу доступны." },
  { icon: PlayCircle, title: "Смотрите видеоуроки", text: "Короткие уроки по шагам: от основ к стратегии. Смотрите с компьютера или телефона." },
  { icon: BookOpenCheck, title: "Применяйте на практике", text: "К урокам — материалы и задания, чтобы сразу навести порядок в своих финансах." },
];

const AUDIENCE = [
  { icon: CircleDollarSign, text: "Зарабатываете, но не понимаете, куда уходят деньги" },
  { icon: ShieldCheck, text: "Хотите избавиться от кредитов и создать подушку безопасности" },
  { icon: LineChart, text: "Думаете начать инвестировать, но боитесь потерять деньги" },
  { icon: PiggyBank, text: "Хотите обеспечить будущее семьи и не зависеть от пенсии" },
];

function PrimaryCta({ className = "" }: { className?: string }) {
  const loggedIn = useHasSession();
  return (
    <Link href={loggedIn ? "/dashboard" : "/register"} className={"lx-btn lx-btn-ink " + className}>
      {loggedIn ? "Перейти к урокам" : "Начать обучение бесплатно"}
      <ArrowRight size={18} />
    </Link>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-36 sm:pt-40">
      <div aria-hidden className="lx-grid-lines pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_20%,transparent_100%)]" />
      <div aria-hidden className="pointer-events-none absolute right-[-10%] top-[-10%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(42,74,138,.16),transparent)]" />
      <div className="lx-container relative grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="lx-eyebrow">Онлайн-школа финансовой грамотности</div>
          <h1 className="lx-display mt-6 text-[clamp(2.4rem,5.4vw,4.2rem)] text-[var(--lx-ink)]">
            Возьмите деньги под&nbsp;контроль и&nbsp;постройте <em>свою независимость</em>
          </h1>
          <p className="lx-lead mt-6 max-w-[560px]">
            Шесть модулей — от финансового мышления и&nbsp;личного бюджета до&nbsp;инвестиций и&nbsp;собственной
            стратегии. Простым языком, на&nbsp;примерах из&nbsp;жизни, без&nbsp;сложных терминов.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <PrimaryCta />
            <a href="#program" className="lx-btn lx-btn-ghost">
              Программа курса
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[14px] text-[var(--lx-ink-2)]">
            <span className="flex items-center gap-2"><GraduationCap size={18} className="text-[var(--lx-gold)]" /> 6 модулей</span>
            <span className="flex items-center gap-2"><PlayCircle size={18} className="text-[var(--lx-gold)]" /> Видеоуроки</span>
            <span className="flex items-center gap-2"><Sparkles size={18} className="text-[var(--lx-gold)]" /> Бесплатный доступ</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[520px]">
          <div aria-hidden className="absolute inset-[8%] rounded-full bg-[radial-gradient(closest-side,rgba(201,162,39,.22),transparent)] blur-2xl" />
          <Image
            src="/logo-full.webp"
            alt="Школа Независимости"
            width={1000}
            height={688}
            priority
            className="relative h-auto w-full drop-shadow-[0_30px_40px_rgba(15,30,61,.18)]"
          />
        </div>
      </div>
    </section>
  );
}

function Program() {
  const { data } = useQuery({
    queryKey: ["course-program"],
    queryFn: () => courseApi.program(),
    retry: false,
  });
  const program = data?.length ? data : FALLBACK_PROGRAM;

  return (
    <section id="program" className="lx-section lx-band scroll-mt-20">
      <div className="lx-container">
        <div className="max-w-[640px]">
          <div className="lx-eyebrow">Программа</div>
          <h2 className="lx-h2 mt-5">
            Шесть шагов к <em>финансовой свободе</em>
          </h2>
          <p className="lx-lead mt-5">
            Каждый модуль решает одну задачу. Проходите по порядку — следующий опирается на предыдущий.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {program.map((m) => (
            <article key={m.position} className="lx-card lx-card-hover flex flex-col p-7">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lx-navy)] font-display text-lg text-[var(--lx-gold)]">
                  {m.position}
                </span>
                {m.lesson_count > 0 && (
                  <span className="lx-chip">
                    {m.lesson_count} {lessonsWord(m.lesson_count)}
                  </span>
                )}
              </div>
              <h3 className="mt-6 text-[21px] leading-snug text-[var(--lx-ink)]">{m.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--lx-ink-2)]">{m.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="lx-section scroll-mt-20">
      <div className="lx-container">
        <div className="max-w-[640px]">
          <div className="lx-eyebrow">Как проходит обучение</div>
          <h2 className="lx-h2 mt-5">
            Учитесь в своём темпе, <em>в любое время</em>
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="lx-card p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--lx-clay-soft)] text-[var(--lx-clay)]">
                  <s.icon size={20} />
                </span>
                <span className="text-[13px] font-medium text-[var(--lx-ink-3)]">Шаг {i + 1}</span>
              </div>
              <h3 className="mt-6 text-[20px] text-[var(--lx-ink)]">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--lx-ink-2)]">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Audience() {
  return (
    <section id="for-whom" className="lx-section lx-band scroll-mt-20">
      <div className="lx-container grid items-start gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="lx-eyebrow">Для кого</div>
          <h2 className="lx-h2 mt-5">
            Курс для тех, кто хочет <em>перестать жить от зарплаты до зарплаты</em>
          </h2>
          <p className="lx-lead mt-5">
            Не нужно быть экономистом. Начнём с нуля и дойдём до личного финансового плана.
          </p>
        </div>
        <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
          {AUDIENCE.map((a) => (
            <li key={a.text} className="lx-card flex gap-4 p-6">
              <a.icon size={22} className="mt-0.5 shrink-0 text-[var(--lx-gold)]" />
              <span className="text-[15.5px] leading-relaxed text-[var(--lx-ink)]">{a.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="lx-section pt-8">
      <div className="lx-container">
        <div className="relative overflow-hidden rounded-[32px] bg-[var(--lx-navy)] bg-[radial-gradient(120%_140%_at_100%_0%,#2a4a8a_0%,#0f1e3d_60%)] px-8 py-16 text-center text-white sm:px-16">
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,39,.25),transparent)]" />
          <Image src="/logo.png" alt="" width={72} height={72} className="relative mx-auto" />
          <h2 className="lx-h2 relative mx-auto mt-6 max-w-[720px] !text-white">
            Начните путь к независимости <span className="text-[var(--lx-gold)]">сегодня</span>
          </h2>
          <p className="relative mx-auto mt-5 max-w-[520px] text-[17px] leading-relaxed text-white/75">
            Регистрация бесплатная — первые уроки доступны сразу после входа.
          </p>
          <div className="relative mt-9 flex justify-center">
            <PrimaryCta className="!bg-[var(--lx-gold)] !text-[var(--lx-navy)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function SchoolLanding() {
  return (
    <>
      <Hero />
      <Program />
      <HowItWorks />
      <Audience />
      <FinalCta />
    </>
  );
}
