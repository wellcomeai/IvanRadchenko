import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandIcon } from "./BrandIcon";
import { PromptLine } from "./CopyButton";
import { Reveal } from "./Reveal";
import { COURSE_URL, DEPLOY_PROMPT, GITHUB_URL } from "./site";

export function CTA() {
  return (
    <section className="lx-section pt-8">
      <div className="lx-container">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-[40px] px-6 py-20 sm:py-28 text-center lx-grain"
            style={{ background: "radial-gradient(ellipse 80% 90% at 50% 110%, #eab79c 0%, #f3dccd 35%, #f8f1ea 70%, #fbf8f4 100%)", border: "1px solid var(--lx-line)" }}
          >
            <div aria-hidden className="absolute inset-0 lx-grid-lines opacity-40 pointer-events-none" style={{ maskImage: "radial-gradient(ellipse 60% 60% at 50% 40%, #000, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 40%, #000, transparent 80%)" }} />
            <div className="relative mx-auto" style={{ maxWidth: 860 }}>
              <h2 className="lx-display" style={{ fontSize: "clamp(2.1rem, 4.6vw, 4rem)", lineHeight: 1.05 }}>
                Каждый, у кого есть идея, <em>заслуживает её запустить</em>
              </h2>
              <p className="lx-lead mx-auto mt-7" style={{ maxWidth: 540 }}>
                Заберите код, дайте агенту ключ — и через 15 минут у вас свой работающий сервис.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="lx-btn lx-btn-ink">
                  <BrandIcon name="github" size={17} color="#fff" />
                  Забрать бесплатно
                </a>
                <Link href={COURSE_URL} className="lx-btn lx-btn-ghost">
                  Курс по развитию <ArrowRight size={16} />
                </Link>
              </div>

              <div className="mt-10 mx-auto" style={{ maxWidth: 560 }}>
                <PromptLine text={DEPLOY_PROMPT} />
              </div>

              <p className="mt-6 text-[13px] text-[var(--lx-ink-3)]">Open source · MIT · Без подписки на шаблон</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
