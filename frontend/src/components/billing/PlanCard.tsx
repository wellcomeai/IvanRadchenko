"use client";

import { Check } from "lucide-react";

import { cn, formatMoney } from "@/lib/utils";
import type { Plan } from "@/types";

interface Props {
  plan: Plan;
  active?: boolean;
  loading?: boolean;
  onSubscribe?: (plan: Plan) => void;
}

/** Карточка тарифа. Текущий тариф — «чернильная», как тёмные блоки лендинга. */
export function PlanCard({ plan, active, loading, onSubscribe }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl border p-7 transition-all duration-300",
        active
          ? "border-transparent bg-foreground text-background shadow-[0_28px_56px_-28px_rgba(22,20,15,.6)]"
          : "border-border bg-card shadow-[0_1px_2px_rgba(22,20,15,.04),0_12px_32px_-16px_rgba(22,20,15,.12)] hover:-translate-y-1 hover:border-foreground/20",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-display text-[11px] uppercase tracking-[0.14em]",
            active ? "text-background/60" : "text-muted-foreground",
          )}
        >
          {plan.name}
        </span>
        {active && (
          <span className="rounded-full bg-clay px-2.5 py-1 text-[11px] font-medium text-white">
            Ваш тариф
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-display text-[34px] leading-none">
          {formatMoney(plan.price, plan.currency)}
        </span>
        <span className={cn("text-sm", active ? "text-background/55" : "text-muted-foreground")}>
          / {plan.interval === "month" ? "мес" : "год"}
        </span>
      </div>

      <div className={cn("my-6 h-px", active ? "bg-background/15" : "bg-border")} />

      <ul className="mb-7 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <span
              className={cn(
                "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                active ? "bg-background/15 text-background" : "bg-clay-soft text-clay-ink",
              )}
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
            </span>
            <span className={active ? "text-background/85" : "text-foreground/80"}>{f}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={loading || active}
        onClick={() => onSubscribe?.(plan)}
        className={cn(
          "h-12 w-full rounded-full text-sm font-medium transition-all duration-200",
          active
            ? "cursor-default bg-background/10 text-background/80"
            : "bg-foreground text-background hover:-translate-y-px hover:shadow-[0_12px_24px_-10px_rgba(22,20,15,.5)] disabled:opacity-60",
        )}
      >
        {active ? "Текущий тариф" : loading ? "Подождите…" : "Выбрать тариф"}
      </button>
    </div>
  );
}
