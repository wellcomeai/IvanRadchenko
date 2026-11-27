"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { courseApi } from "@/api/course";
import { LessonIcon, isLocked, lessonHint } from "@/components/course/status";
import { useAuthStore } from "@/store/authStore";
import { cn, formatDate, formatMoney } from "@/lib/utils";

export default function ModulePage() {
  const { id } = useParams<{ id: string }>();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const { data: modules, isLoading } = useQuery({
    queryKey: ["course-modules"],
    queryFn: () => courseApi.modules(),
  });
  const mod = modules?.find((m) => m.id === id);

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!mod) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Модуль не найден"
        description="Возможно, ссылка устарела."
        action={{ label: "На главную", href: "/dashboard" }}
      />
    );
  }

  const total = mod.lessons.length;
  const unpaid = !isAdmin && !mod.access_until;

  return (
    <>
      <div>
        <div className="font-display text-[11px] uppercase tracking-[0.18em] text-clay">
          Модуль {mod.position} из {modules?.length ?? 6}
        </div>
        <h1 className="mt-2 font-display text-[28px] leading-tight text-foreground sm:text-[34px]">
          {mod.title}
        </h1>
        {mod.description && (
          <p className="mt-3 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
            {mod.description}
          </p>
        )}
        {!isAdmin && total > 0 && (
          <div className="mt-5 max-w-md">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Пройдено {mod.completed_count} из {total}
              </span>
              {mod.access_until && <span>Доступ до {formatDate(mod.access_until)}</span>}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-sage transition-all"
                style={{ width: `${Math.round((mod.completed_count / total) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {unpaid && (
        <div className="flex flex-col gap-4 rounded-2xl border border-gold/40 bg-gold-soft/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <div className="font-medium">Модуль не оплачен</div>
              <div className="text-sm text-muted-foreground">
                Откройте этот модуль за {formatMoney(mod.price)} или весь курс сразу.
                {mod.lessons.some((l) => l.is_free) && " Первый урок можно посмотреть бесплатно."}
              </div>
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/billing">Открыть доступ</Link>
          </Button>
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card">
          <EmptyState
            icon={BookOpen}
            title="Уроки скоро появятся"
            description="Мы готовим материалы этого модуля."
          />
        </div>
      ) : (
        <ol className="space-y-3">
          {mod.lessons.map((lesson, i) => {
            const locked = isLocked(lesson);
            const body = (
              <>
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-sm",
                    lesson.status === "completed" ? "bg-emerald-50 text-sage" : "bg-secondary text-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">
                    {lesson.title}
                    {!lesson.is_published && (
                      <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        черновик
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LessonIcon lesson={lesson} className="h-3.5 w-3.5" />
                    {lessonHint(lesson)}
                  </div>
                </div>
                {!locked && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-clay" />
                )}
              </>
            );
            const cls =
              "flex items-center gap-4 rounded-2xl border border-border bg-card p-4 no-underline sm:p-5";
            return (
              <li key={lesson.id}>
                {locked ? (
                  <div className={cn(cls, "opacity-60")} aria-disabled>
                    {body}
                  </div>
                ) : (
                  <Link
                    href={`/lessons/${lesson.id}`}
                    className={cn(
                      cls,
                      "group transition-all duration-300 hover:-translate-y-0.5 hover:border-clay/40",
                      !lesson.is_published && "opacity-70",
                    )}
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
