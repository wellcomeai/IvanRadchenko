"use client";

import { useQuery } from "@tanstack/react-query";

import { courseApi } from "@/api/course";
import { DEFAULT_PRICING } from "@/lib/legal";
import { formatMoney } from "@/lib/utils";

/** Актуальные цены из админки; пока грузятся — значения по умолчанию. */
function usePricing() {
  const { data } = useQuery({
    queryKey: ["course-pricing"],
    queryFn: () => courseApi.pricing(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return {
    fullPrice: data ? Number(data.full_price) : DEFAULT_PRICING.fullPrice,
    accessDays: data?.access_days ?? DEFAULT_PRICING.accessDays,
    modules: data?.modules ?? [],
  };
}

export function FullPrice() {
  return <strong>{formatMoney(usePricing().fullPrice)}</strong>;
}

export function AccessDays() {
  return <>{usePricing().accessDays}</>;
}

/** Цены модулей: одна строка, если все одинаковые, иначе список. */
export function ModulePrices() {
  const { modules } = usePricing();
  const prices = new Set(modules.map((m) => Number(m.price)));
  if (modules.length === 0 || prices.size === 1) {
    const price = modules.length ? Number(modules[0].price) : DEFAULT_PRICING.modulePrice;
    return <strong>{formatMoney(price)} за каждый модуль</strong>;
  }
  return (
    <ul>
      {modules.map((m) => (
        <li key={m.id}>
          Модуль {m.position} «{m.title}» — <strong>{formatMoney(m.price)}</strong>
        </li>
      ))}
    </ul>
  );
}
