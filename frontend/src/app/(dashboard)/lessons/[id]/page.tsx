"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpen, Download, FileText, Pencil, VideoOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { courseApi } from "@/api/course";
import { useAuthStore } from "@/store/authStore";
import { formatBytes } from "@/lib/utils";

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const { data: lesson, isLoading, isError } = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => courseApi.lesson(id),
    // Ссылки на видео живут 6 часов — обновляем страницу данных заранее.
    staleTime: 60 * 60 * 1000,
    refetchInterval: 4 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
      </div>
    );
  }
  if (isError || !lesson) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Урок не найден"
        description="Возможно, он ещё не опубликован или ссылка устарела."
        action={{ label: "На главную", href: "/dashboard" }}
      />
    );
  }

  const videos = lesson.materials.filter((m) => m.kind === "video");
  const files = lesson.materials.filter((m) => m.kind === "file");

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/modules/${lesson.module_id}`}
            className="font-display text-[11px] uppercase tracking-[0.18em] text-clay no-underline hover:text-clay-ink"
          >
            Модуль {lesson.module_position} · {lesson.module_title}
          </Link>
          <h1 className="mt-2 font-display text-[26px] leading-tight text-foreground sm:text-[32px]">
            {lesson.title}
            {!lesson.is_published && (
              <span className="ml-3 align-middle rounded bg-secondary px-2 py-0.5 font-body text-xs text-muted-foreground">
                черновик
              </span>
            )}
          </h1>
        </div>
        {isAdmin && (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`/admin/course/lessons/${lesson.id}`}>
              <Pencil className="h-3.5 w-3.5" />
              Редактировать
            </Link>
          </Button>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card text-sm text-muted-foreground">
          <VideoOff className="h-6 w-6" />
          Видео к этому уроку пока нет
        </div>
      ) : (
        videos.map((v) => (
          <figure key={v.id} className="space-y-2">
            <div className="overflow-hidden rounded-2xl bg-black shadow-[0_28px_56px_-32px_rgba(15,30,61,.5)]">
              {/* key по url: при обновлении ссылки плеер перезагружается */}
              <video
                key={v.url ?? v.id}
                src={v.url ?? undefined}
                controls
                controlsList="nodownload"
                preload="metadata"
                playsInline
                className="aspect-video w-full"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
            {videos.length > 1 && (
              <figcaption className="text-sm text-muted-foreground">{v.title}</figcaption>
            )}
          </figure>
        ))
      )}

      {lesson.description && (
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="mb-3 font-display text-lg">Описание урока</h2>
          <div className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">
            {lesson.description}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="mb-4 font-display text-lg">Материалы</h2>
          <ul className="divide-y divide-border">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-soft text-clay">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{formatBytes(f.size_bytes)}</div>
                </div>
                {f.url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={f.url} download={f.filename}>
                      <Download className="h-3.5 w-3.5" />
                      Скачать
                    </a>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        {lesson.prev_lesson_id ? (
          <Button asChild variant="outline">
            <Link href={`/lessons/${lesson.prev_lesson_id}`}>
              <ArrowLeft className="h-4 w-4" />
              Предыдущий
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {lesson.next_lesson_id ? (
          <Button asChild>
            <Link href={`/lessons/${lesson.next_lesson_id}`}>
              Следующий урок
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">Это последний урок курса</span>
        )}
      </div>
    </>
  );
}
