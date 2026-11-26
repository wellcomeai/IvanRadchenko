import type { ReactNode } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/layout/Footer";
import { LandingShell } from "@/components/landing/LandingShell";
import { LEGAL_UPDATED_AT, SELLER } from "@/lib/legal";

/** Обёртка для юридических документов: оферта, политика, соглашение. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <LandingShell>
      <PublicHeader />
      <main className="pb-24 pt-32 sm:pt-36">
        <article className="lx-container legal-doc max-w-[860px]">
          <div className="lx-eyebrow">Документы</div>
          <h1 className="lx-h2 mt-5">{title}</h1>
          <p className="mt-3 text-[14px] text-[var(--lx-ink-3)]">Редакция от {LEGAL_UPDATED_AT}</p>
          <div className="mt-10 space-y-4 text-[15.5px] leading-relaxed text-[var(--lx-ink-2)] [&_h2]:mt-10 [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:text-[var(--lx-ink)] [&_a]:text-[var(--lx-ink)] [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </LandingShell>
  );
}

/** Блок реквизитов продавца — в конце каждого документа. */
export function SellerDetails() {
  return (
    <ul>
      <li>{SELLER.name}</li>
      <li>ИНН: {SELLER.inn}</li>
      <li>ОГРНИП: {SELLER.ogrnip} (запись в ЕГРИП от {SELLER.registeredAt})</li>
      <li>Адрес: {SELLER.address}</li>
      <li>
        Телефон: <a href={SELLER.phoneHref}>{SELLER.phone}</a>
      </li>
      <li>
        Email: <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a>
      </li>
    </ul>
  );
}
