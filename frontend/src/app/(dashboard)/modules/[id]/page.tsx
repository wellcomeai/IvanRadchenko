"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, FileText, PlayCircle } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { courseApi } from "@/api/course";
import { cn } from "@/lib/utils";

export default function ModulePage() {
  const { id } = useParams<{ id: string }>();
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
      </div>

      {mod.lessons.length === 0 ? (
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
            const Icon = lesson.has_video ? PlayCircle : FileText;
            return (
              <li key={lesson.id}>
                <Link
                  href={`/lessons/${lesson.id}`}
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 no-underline transition-all duration-300 hover:-translate-y-0.5 hover:border-clay/40 sm:p-5",
                    !lesson.is_published && "opacity-70",
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary font-display text-sm text-foreground">
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
                      <Icon className="h-3.5 w-3.5" />
                      {lesson.has_video ? "Видеоурок" : "Урок"}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-clay" />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
