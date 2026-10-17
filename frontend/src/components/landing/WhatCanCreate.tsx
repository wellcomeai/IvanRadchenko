import { Bot, GraduationCap, KeyRound, Repeat, ShoppingBag, Users } from "lucide-react";
import { Stagger, StaggerItem } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { keepHyphenated } from "./typography";

const examples = [
  { Icon: GraduationCap, title: "Онлайн-школа или клуб", text: "Закрытые уроки по подписке, пробный период, приглашения друзей за бонус.", uses: ["Подписки", "Триал", "Рефералы"] },
  { Icon: Bot, title: "AI-сервис", text: "Генерация текстов, картинок, ответов по документам — с оплатой за тариф.", uses: ["Тарифы", "Лимиты", "API-ключи"] },
  { Icon: KeyRound, title: "API для разработчиков", text: "Продавайте доступ к данным или функции по ключу — как делают большие сервисы.", uses: ["API-ключи", "Rate limit", "Биллинг"] },
  { Icon: Repeat, title: "Сервис подписок", text: "Шаблоны, чек-листы, база знаний, трекер — всё, за что платят каждый месяц.", uses: ["Подписки", "Кабинет", "Письма"] },
  { Icon: Users, title: "CRM для ниши", text: "Запись клиентов для салонов, учёт заявок для строителей, кабинет для репетиторов.", uses: ["Кабинет", "Админка", "Уведомления"] },
  { Icon: ShoppingBag, title: "Маркетплейс услуг", text: "Исполнители и заказчики находят друг друга, платформа берёт подписку.", uses: ["Кабинет", "Оплата", "Партнёрка"] },
];

export function WhatCanCreate() {
  return (
    <section id="examples" className="lx-section">
      <div className="lx-container">
        <SectionHeading
          tag="Что можно создать"
          title={<>Одна основа — <em>десятки бизнесов</em></>}
          text="Регистрация, оплата, кабинет и админка уже работают. Вы добавляете только свою идею — вместе с агентом."
        />

        <Stagger className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-[var(--lx-line-2)]">
          {examples.map(({ Icon, title, text, uses }, i) => (
            <StaggerItem
              key={title}
              className="group relative p-8 lg:p-10 border-r border-b border-[var(--lx-line-2)] bg-transparent hover:bg-white transition-colors duration-500"
            >
              <div className="flex items-start justify-between mb-10">
                <Icon size={26} strokeWidth={1.4} className="text-[var(--lx-ink)] group-hover:text-[var(--lx-clay)] transition-colors duration-500" />
                <span className="lx-mono text-[12px] text-[var(--lx-ink-3)]">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="text-[20px] leading-[1.2] mb-3">{keepHyphenated(title)}</h3>
              <p className="text-[15px] text-[var(--lx-ink-2)] leading-relaxed mb-6">{text}</p>
              <div className="flex flex-wrap gap-1.5">
                {uses.map((u) => (
                  <span key={u} className="lx-chip">{u}</span>
                ))}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
