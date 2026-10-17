import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { COURSE_PRICE, COURSE_URL } from "./site";

const modules = [
  { n: "01", title: "Как устроен ваш сервис", text: "Фронтенд, бэкенд, база, оплата — на примерах из жизни." },
  { n: "02", title: "Из шаблона — в продукт", text: "Упаковываем идею: что оставить, что убрать, что добавить." },
  { n: "03", title: "Почта и Робокасса", text: "Подключаем письма и приём денег, проводим первую оплату." },
  { n: "04", title: "Разработка с Claude Code", text: "Как ставить задачи агенту, чтобы он делал именно то, что нужно." },
  { n: "05", title: "Свой домен и дизайн", text: "Бренд, логотип, цвета и тексты — сервис выглядит как ваш." },
  { n: "06", title: "Поддержка и рост", text: "Обновления, бэкапы, аналитика, как не сломать работающее." },
];

const perks = ["Записанные уроки — смотрите в своём темпе", "Готовые промпты к каждому уроку", "Доступ навсегда и все будущие обновления"];

export function CourseSection() {
  return (
    <section id="course" className="lx-section lx-band">
      <div className="lx-container">
        <SectionHeading
          tag="Курс · что дальше"
          title={<>Запустили за 15 минут. <em>Теперь&nbsp;— развиваем</em></>}
          text="Шаблон бесплатный и таким останется. Курс — для тех, кто хочет превратить его в свой бизнес и уверенно дорабатывать через Claude Code."
        />

        <div className="mt-16 grid lg:grid-cols-[1.55fr_1fr] gap-6 items-stretch">
          <Stagger className="lx-card p-8 sm:p-10 grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {modules.map((m) => (
              <StaggerItem key={m.n} className="border-t border-[var(--lx-line-2)] pt-5">
                <div className="lx-display text-[var(--lx-clay)] text-[20px] leading-none mb-3">{m.n}</div>
                <div className="font-semibold text-[17px] mb-1.5">{m.title}</div>
                <div className="text-[14.5px] text-[var(--lx-ink-2)] leading-relaxed">{m.text}</div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.1}>
            <div
              className="relative h-full rounded-[28px] p-9 flex flex-col overflow-hidden text-white"
              style={{ background: "linear-gradient(165deg,#221f19 0%,#16140f 100%)", boxShadow: "var(--lx-shadow-lg)" }}
            >
              <div aria-hidden className="absolute pointer-events-none" style={{ width: 420, height: 420, top: -180, right: -160, borderRadius: "50%", filter: "blur(60px)", background: "radial-gradient(circle, rgba(224,138,104,0.45) 0%, transparent 65%)" }} />
              <div className="relative text-[12px] font-semibold tracking-[0.16em] uppercase text-white/55 mb-5">Записанный курс</div>
              <div className="relative lx-display leading-none" style={{ fontSize: 54 }}>{COURSE_PRICE}</div>
              <div className="relative text-[14px] text-white/55 mt-2 mb-9">разовый платёж</div>
              <ul className="relative space-y-4 mb-10 flex-1">
                {perks.map((p) => (
                  <li key={p} className="flex gap-3 text-[15px] text-white/85">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-none mt-0.5 bg-white/10"><Check size={12} strokeWidth={2.5} /></span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link href={COURSE_URL} className="relative lx-btn w-full bg-white text-[var(--lx-ink)] hover:-translate-y-0.5" style={{ boxShadow: "0 10px 30px -10px rgba(0,0,0,.5)" }}>
                Купить курс <ArrowRight size={17} />
              </Link>
              <div className="relative text-center text-[12.5px] text-white/45 mt-4">Оплата картой через Робокассу</div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
