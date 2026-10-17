import type { ReactNode } from "react";

/** Заголовок страницы кабинета: шрифт и отступы как у секций лендинга. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[28px] leading-tight text-foreground sm:text-[32px]">{title}</h1>
        {description && <p className="mt-2 text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
