"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, GraduationCap, Lock } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { PaymentHistory } from "@/components/billing/PaymentHistory";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { courseApi } from "@/api/course";
import { cn, errorMessage, formatDate, formatMoney } from "@/lib/utils";
import type { ShopModule } from "@/types";

/**
 * Робокасса возвращает сюда и после оплаты (Success URL), и после отказа (Fail URL).
 * На Success URL она добавляет SignatureValue, на Fail URL — нет.
 */
function PaymentStatusHandler({ onPaid }: { onPaid: () => void }) {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const invId = params.get("InvId");
    const legacy = params.get("status");
    if (!invId && !legacy) return;
    if (params.get("SignatureValue") || legacy === "success") {
      toast.success("Оплата прошла! Доступ откроется в течение минуты.");
      onPaid();
    } else {
      toast.error("Оплата не прошла. Попробуйте ещё раз или выберите другой способ.");
    }
    router.replace("/billing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function moduleState(m: ShopModule, prev?: ShopModule) {
  if (m.blocked_by === "included_in_course") return { text: "Входит в оплаченный курс", tone: "ok" as const };
  if (m.blocked_by === "owned") return { text: `Оплачен до ${formatDate(m.access_until)}`, tone: "ok" as const };
  if (m.blocked_by === "need_previous")
    return { text: `Сначала модуль ${prev?.position ?? m.position - 1}`, tone: "locked" as const };
  if (m.access_until) return { text: `Доступ до ${formatDate(m.access_until)} — можно продлить`, tone: "renew" as const };
  return null;
}

export default function BillingPage() {
  const qc = useQueryClient();
  // После оплаты webhook приходит не мгновенно — минуту обновляем данные.
  const [polling, setPolling] = useState(false);
  const { data: shop, isLoading } = useQuery({
    queryKey: ["course-shop"],
    queryFn: () => courseApi.shop(),
    refetchInterval: polling ? 5000 : false,
  });
  useEffect(() => {
    if (!polling) return;
    const t = setTimeout(() => setPolling(false), 60_000);
    return () => clearTimeout(t);
  }, [polling]);
  useEffect(() => {
    if (polling) qc.invalidateQueries({ queryKey: ["course-modules"] });
  }, [shop, polling, qc]);

  const buy = useMutation({
    mutationFn: (v: { product: "course" | "module"; moduleId?: string }) =>
      courseApi.checkout(v.product, v.moduleId),
    onSuccess: (r) => {
      window.location.href = r.payment_url;
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось создать платёж")),
  });

  const full = shop?.full_course;

  return (
    <>
      <Suspense>
        <PaymentStatusHandler onPaid={() => setPolling(true)} />
      </Suspense>

      <PageHeader
        title="Оплата курса"
        description="Купите весь курс сразу или модули по одному — по порядку, начиная с первого."
      />

      {isLoading || !shop || !full ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : (
        <>
          <section className="relative overflow-hidden rounded-[24px] bg-[#0f1e3d] bg-[radial-gradient(120%_120%_at_100%_0%,#2a4a8a_0%,#0f1e3d_55%)] p-6 text-white sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.18em] text-gold">
                  <GraduationCap className="h-4 w-4" /> Весь курс
                </div>
                <div className="mt-3 font-display text-[40px] leading-none">{formatMoney(full.price)}</div>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
                  Все {shop.modules.length} модулей сразу, доступ на {shop.access_days} дней. Уроки открываются
                  по порядку по мере прохождения.
                </p>
                {full.access_until && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> Оплачен до {formatDate(full.access_until)}
                  </p>
                )}
              </div>
              {full.can_buy && (
                <Button
                  size="lg"
                  className="shrink-0 bg-gold text-[#0f1e3d] hover:bg-gold/90"
                  disabled={buy.isPending}
                  onClick={() => buy.mutate({ product: "course" })}
                >
                  {full.access_until ? "Продлить доступ" : "Купить весь курс"}
                </Button>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-1 font-display text-lg">Или по модулям</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Каждый модуль — {shop.access_days} дней доступа. Следующий модуль можно купить после предыдущего.
            </p>
            <ol className="space-y-3">
              {shop.modules.map((m, i) => {
                const state = moduleState(m, shop.modules[i - 1]);
                return (
                  <li
                    key={m.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5",
                      state?.tone === "locked" && "opacity-70",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f1e3d] font-display text-sm text-gold">
                        {m.position}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium">{m.title}</div>
                        {state && (
                          <div
                            className={cn(
                              "mt-0.5 flex items-center gap-1.5 text-xs",
                              state.tone === "ok" ? "text-sage" : "text-muted-foreground",
                            )}
                          >
                            {state.tone === "ok" ? <CheckCircle2 className="h-3.5 w-3.5" /> : state.tone === "locked" ? <Lock className="h-3.5 w-3.5" /> : null}
                            {state.text}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="font-display text-lg">{formatMoney(m.price)}</span>
                      {m.can_buy && (
                        <Button
                          variant={m.access_until ? "outline" : "default"}
                          disabled={buy.isPending}
                          onClick={() => buy.mutate({ product: "module", moduleId: m.id })}
                        >
                          {m.access_until ? "Продлить" : "Купить"}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Оплата банковской картой и другими способами через Робокассу. Чек придёт на вашу почту. Оплачивая,
            вы принимаете условия{" "}
            <Link href="/offer" target="_blank" className="underline">
              публичной оферты
            </Link>
            .
          </p>
        </>
      )}

      <PaymentHistory />
    </>
  );
}
