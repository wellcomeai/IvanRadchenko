import Link from "next/link";
import { ArrowRight, LayoutDashboard, Sparkles, UserPlus } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./Reveal";

const cards = [
  { Icon: UserPlus, title: "Зарегистрируйся", text: "Та же форма, что получишь ты" },
  { Icon: LayoutDashboard, title: "Загляни в кабинет", text: "Подписки, рефералы, настройки" },
  { Icon: Sparkles, title: "Исследуй сам", text: "Всё, что видишь, — бесплатно и твоё" },
];

export function LiveDemo() {
  return (
    <section className="lx-section pt-0">
      <div className="lx-container">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-[36px] px-6 py-16 sm:px-14 sm:py-20 text-center"
            style={{ background: "linear-gradient(160deg,#fff 0%,#f6efe6 100%)", border: "1px solid var(--lx-line)", boxShadow: "var(--lx-shadow-lg)" }}
          >
            <div aria-hidden className="absolute inset-0 lx-grid-lines opacity-50 pointer-events-none" style={{ maskImage: "radial-gradient(ellipse 60% 70% at 50% 0%, #000, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 60% 70% at 50% 0%, #000, transparent 80%)" }} />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[var(--lx-line)] px-3.5 py-1.5 text-[12.5px] font-semibold text-[var(--lx-ink-2)]">
                <span className="lx-live-dot" /> Живое демо · протестируйте
              </div>
              <h2 className="lx-h2 mt-7 mx-auto" style={{ maxWidth: 820 }}>
                «Этот сайт — <em>и есть шаблон</em>»
              </h2>
              <p className="lx-lead mt-6 mx-auto" style={{ maxWidth: 640 }}>
                То, что вы видите, — не макет. Это работающий сервис на том самом открытом коде.
                Зарегистрируйтесь и потрогайте всё руками: через 15 минут у вас будет такой же —
                со своим брендом, своими пользователями и своими подписками.
              </p>

              <Stagger className="mt-12 grid md:grid-cols-3 gap-4 text-left">
                {cards.map(({ Icon, title, text }) => (
                  <StaggerItem key={title} className="rounded-2xl bg-white/80 backdrop-blur border border-[var(--lx-line)] p-6 flex items-center gap-4">
                    <span className="w-11 h-11 rounded-full flex items-center justify-center flex-none bg-[var(--lx-sand)]">
                      <Icon size={19} strokeWidth={1.7} className="text-[var(--lx-ink)]" />
                    </span>
                    <span>
                      <span className="block font-semibold text-[16px]">{title}</span>
                      <span className="block text-[14px] text-[var(--lx-ink-3)]">{text}</span>
                    </span>
                  </StaggerItem>
                ))}
              </Stagger>

              <div className="mt-12">
                <Link href="/register" className="lx-btn lx-btn-clay">
                  Попробовать демо <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
