"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, PlayCircle } from "lucide-react";

import { EmailBanner } from "@/components/EmailBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { courseApi } from "@/api/course";
import { useAuthStore } from "@/store/authStore";
import { lessonsWord } from "@/components/course/plural";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: modules, isLoading } = useQuery({
    queryKey: ["course-modules"],
    queryFn: () => courseApi.modules(),
  });

  const firstName = user?.profile?.first_name;
  const firstLesson = modules?.flatMap((m) => m.lessons)[0];
  const totalLessons = modules?.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0;

  return (
    <>
      <div className="space-y-3">
        <EmailBanner />
      </div>

      {/* Приветствие */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#0f1e3d] bg-[radial-gradient(120%_120%_at_100%_0%,#2a4a8a_0%,#0f1e3d_55%)] px-6 py-9 text-white shadow-[0_28px_56px_-32px_rgba(15,30,61,.6)] sm:px-10 sm:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,39,.28),transparent)]"
        />
        <div className="relative max-w-2xl">
          <div className="font-display text-[11px] uppercase tracking-[0.18em] text-gold">
            Школа Независимости
          </div>
          <h1 className="mt-3 font-display text-[28px] leading-tight sm:text-[36px]">
            {firstName ? `${firstName}, добро пожаловать!` : "Добро пожаловать!"}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75 sm:text-base">
            Курс по финансовой грамотности: 6 модулей от финансового мышления до
            собственной стратегии независимости. Проходите уроки по порядку — каждый
            следующий опирается на предыдущий.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {firstLesson ? (
              <Link
                href={`/lessons/${firstLesson.id}`}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-[#0f1e3d] no-underline transition-transform hover:-translate-y-px"
              >
                <PlayCircle className="h-4 w-4" />
                Начать обучение
              </Link>
            ) : (
              !isLoading && (
                <span className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70">
                  Первые уроки скоро появятся
                </span>
              )
            )}
            {totalLessons > 0 && (
              <span className="text-sm text-white/60">
                Доступно {totalLessons} {lessonsWord(totalLessons)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Модули */}
      <div>
        <h2 className="mb-4 font-display text-lg">Программа курса</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          {modules?.map((m) => (
            <Link
              key={m.id}
              href={`/modules/${m.id}`}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 no-underline shadow-[0_1px_2px_rgba(15,30,61,.04),0_12px_32px_-16px_rgba(15,30,61,.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-clay/40"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f1e3d] font-display text-sm text-gold">
                  {m.position}
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-clay" />
              </div>
              <div className="mt-4 font-display text-[17px] leading-snug text-foreground">{m.title}</div>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {m.description}
              </p>
              <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium text-clay">
                {m.lessons.length > 0 ? `${m.lessons.length} ${lessonsWord(m.lessons.length)}` : "Скоро"}
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
