"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CreditCard, Gift, Settings, TrendingUp, Users } from "lucide-react";

import { TrialBanner } from "@/components/billing/TrialBanner";
import { EmailBanner } from "@/components/EmailBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { referralsApi } from "@/api/referrals";
import { formatMoney } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const quickActions = [
  { href: "/billing", icon: CreditCard, label: "Подписка", hint: "Тариф и платежи" },
  { href: "/referrals", icon: Gift, label: "Рефералы", hint: "Приглашайте и зарабатывайте" },
  { href: "/settings", icon: Settings, label: "Настройки", hint: "Профиль и пароль" },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stats } = useQuery({
    queryKey: ["referrals-stats"],
    queryFn: () => referralsApi.stats(),
  });

  const firstName = user?.profile?.first_name;

  const statCards = [
    {
      label: "Заработано на рефералах",
      value: formatMoney(stats?.total_earned ?? 0),
      sub: `Приглашено: ${stats?.total_referred ?? 0}`,
      icon: TrendingUp,
    },
    {
      label: "Ожидает выплаты",
      value: formatMoney(stats?.pending_payout ?? 0),
      sub: `Оплатили: ${stats?.converted ?? 0}`,
      icon: Users,
    },
  ];

  return (
    <>
      <PageHeader
        title={firstName ? `Здравствуйте, ${firstName}` : "Главная"}
        description="Сводка по вашему аккаунту."
      />

      <div className="space-y-3">
        <EmailBanner />
        <TrialBanner />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(22,20,15,.04),0_12px_32px_-16px_rgba(22,20,15,.12)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-clay">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
              </div>
              <div className="mt-4 font-display text-[32px] leading-none text-foreground">
                {card.value}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{card.sub}</div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg">Быстрые действия</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {quickActions.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className="group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 no-underline transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_18px_40px_-24px_rgba(22,20,15,.35)]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors group-hover:bg-clay-soft group-hover:text-clay-ink">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-foreground">{q.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{q.hint}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-clay" />
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
