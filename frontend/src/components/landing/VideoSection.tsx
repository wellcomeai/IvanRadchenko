import { Clock, Play } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { VIDEO_URL } from "./site";

const chapters = [
  { t: "0:00", title: "Копируем репозиторий на GitHub" },
  { t: "1:30", title: "Регистрируемся в Timeweb и берём API-ключ" },
  { t: "3:00", title: "Открываем проект в Claude Code или Codex" },
  { t: "4:00", title: "Одно сообщение — и агент деплоит" },
  { t: "8:00", title: "Заходим в админку готового сервиса" },
];

export function VideoSection() {
  return (
    <section id="video" className="lx-section">
      <div className="lx-container">
        <SectionHeading
          tag="Видео · 10 минут"
          title={<>Как запустить <em>свой первый</em> онлайн-бизнес</>}
          text="Повторяйте за экраном: от пустого аккаунта до работающего сайта с оплатой и админкой."
        />

        <div className="mt-16 grid lg:grid-cols-[1.65fr_1fr] gap-6 items-stretch">
          <Reveal className="min-w-0">
            <div
              className="relative rounded-[28px] overflow-hidden w-full"
              style={{ aspectRatio: "16 / 10", background: "linear-gradient(145deg,#efe7db 0%,#e5d8c6 100%)", boxShadow: "var(--lx-shadow-lg)" }}
            >
              {VIDEO_URL ? (
                <iframe
                  src={VIDEO_URL}
                  title="Как запустить свой первый онлайн-бизнес за 10 минут"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <div aria-hidden className="absolute inset-0 lx-grid-lines opacity-60" style={{ maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 90%)", WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 90%)" }} />
                  <div className="relative w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-white" style={{ boxShadow: "0 20px 50px -10px rgba(159,74,40,0.35)" }}>
                    <Play size={30} className="text-[var(--lx-clay)] ml-1" fill="currentColor" />
                  </div>
                  <div className="relative inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-[var(--lx-clay-ink)] bg-white/70 backdrop-blur mb-3">
                    <Clock size={13} /> Видео скоро появится
                  </div>
                  <p className="relative text-[var(--lx-ink-2)] text-[15px] max-w-sm">
                    Пока его нет — пролистайте ниже: там те же три шага текстом и готовые промпты.
                  </p>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="min-w-0">
            <div className="lx-card p-8 h-full flex flex-col">
              <div className="text-[12px] font-semibold tracking-[0.16em] uppercase text-[var(--lx-ink-3)] mb-6">Что в видео</div>
              <Stagger className="flex-1">
                {chapters.map((c) => (
                  <StaggerItem key={c.t} className="flex gap-4 py-3.5 border-b border-[var(--lx-line)] last:border-0">
                    <span className="lx-mono text-[12.5px] text-[var(--lx-clay)] pt-0.5 w-10 flex-none">{c.t}</span>
                    <span className="text-[15px] text-[var(--lx-ink)]">{c.title}</span>
                  </StaggerItem>
                ))}
              </Stagger>
              <div className="mt-6 pt-5 border-t border-[var(--lx-line)] text-[13.5px] leading-relaxed text-[var(--lx-ink-3)]">
                Понадобится: аккаунт GitHub, аккаунт Timeweb Cloud с балансом от 500 ₽ и Claude Code или Codex.
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
