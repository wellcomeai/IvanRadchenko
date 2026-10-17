import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Карточка страниц входа: тот же язык, что у карточек лендинга. */
export function AuthCard({
  icon,
  eyebrow,
  title,
  description,
  children,
  footer,
  className,
}: {
  icon?: ReactNode;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-border bg-card px-6 py-8 shadow-[0_1px_2px_rgba(22,20,15,.04),0_28px_56px_-32px_rgba(22,20,15,.22)] sm:px-9 sm:py-10",
        className,
      )}
    >
      {icon && (
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-soft text-clay-ink">
          {icon}
        </div>
      )}
      {eyebrow && (
        <div className="mb-4 inline-flex items-center gap-2.5 font-display text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="h-px w-6 bg-clay" />
          {eyebrow}
        </div>
      )}
      <h1 className="font-display text-[26px] leading-[1.15] text-foreground [text-wrap:balance]">
        {title}
      </h1>
      {description && (
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
          {description}
        </p>
      )}
      {children && <div className="mt-7">{children}</div>}
      {footer && (
        <div className="mt-7 border-t border-border pt-5 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}

/** Ссылка внутри карточек входа. */
export const authLinkClass =
  "font-medium text-foreground underline decoration-clay/40 underline-offset-4 transition-colors hover:text-clay hover:decoration-clay";
