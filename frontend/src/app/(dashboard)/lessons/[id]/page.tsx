"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Lock,
  Pencil,
  VideoOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { courseApi } from "@/api/course";
import { useAuthStore } from "@/store/authStore";
import { errorMessage, formatBytes, formatDate } from "@/lib/utils";

type LockCode = "locked_payment" | "locked_sequence";

function lockCode(err: unknown): LockCode | null {
  const e = err as AxiosError<{ detail?: { code?: string } }>;
  const code = e?.response?.status === 403 ? e.response.data?.detail?.code : undefined;
  return code === "locked_payment" || code === "locked_sequence" ? code : null;
}

function LockedLesson({ code }: { code: LockCode }) {
  const payment = code === "locked_payment";
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft text-gold">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="mt-5 font-display text-2xl">
        {payment ? "Урок откроется после оплаты" : "Сначала пройдите предыдущие уроки"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        {payment
          ? "Этот модуль ещё не оплачен. Откройте его отдельно или купите весь курс сразу."
          : "Уроки открываются по порядку: нажмите «Урок пройден» в конце предыдущего урока, и этот откроется."}
      </p>
      <Button asChild className="mt-7">
        <Link href={payment ? "/billing" : "/dashboard"}>{payment ? "Открыть доступ" : "К программе курса"}</Link>
      </Button>
    </div>
  );
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const qc = useQueryClient();
  const { data: modules } = useQuery({
    queryKey: ["course-modules"],
    queryFn: () => courseApi.modules(),
  });
  const { data: lesson, isLoading, isError, error } = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => courseApi.lesson(id),
    retry: (count, err) => !lockCode(err) && count < 2,
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
  const locked = lockCode(error);
  if (locked) return <LockedLesson code={locked} />;
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

  const nextBrief = modules?.flatMap((m) => m.lessons).find((l) => l.id === lesson.next_lesson_id);
  const done = Boolean(lesson.completed_at) || lesson.status === "completed";

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

      {!isAdmin && (
        <CompleteBlock
          lessonId={lesson.id}
          done={done}
          completedAt={lesson.completed_at}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["course-modules"] });
            qc.invalidateQueries({ queryKey: ["lesson", id] });
          }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
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
        {!lesson.next_lesson_id ? (
          <span className="text-sm text-muted-foreground">Это последний урок курса</span>
        ) : isAdmin || (done && nextBrief?.status !== "locked_payment") ? (
          <Button asChild>
            <Link href={`/lessons/${lesson.next_lesson_id}`}>
              Следующий урок
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : done && nextBrief?.status === "locked_payment" ? (
          <Button asChild>
            <Link href="/billing">
              Оплатить следующий модуль
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">
            Следующий урок откроется, когда отметите этот пройденным
          </span>
        )}
      </div>
    </>
  );
}

function CompleteBlock({
  lessonId,
  done,
  completedAt,
  onDone,
}: {
  lessonId: string;
  done: boolean;
  completedAt: string | null;
  onDone: () => void;
}) {
  const complete = useMutation({
    mutationFn: () => courseApi.complete(lessonId),
    onSuccess: (r) => {
      if (r.next_lesson_status === "locked_payment") {
        toast.success("Урок пройден! Следующий модуль откроется после оплаты.");
      } else if (r.next_lesson_id) {
        toast.success("Урок пройден! Следующий урок открыт.");
      } else {
        toast.success("Поздравляем! Вы прошли весь курс.");
      }
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось отметить урок")),
  });

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-sage" />
        <span>
          <span className="font-medium">Урок пройден</span>
          {completedAt && <span className="text-muted-foreground"> · {formatDate(completedAt)}</span>}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm">
        <div className="font-medium">Посмотрели урок и выполнили задание?</div>
        <div className="text-muted-foreground">Отметьте урок пройденным — откроется следующий.</div>
      </div>
      <Button size="lg" className="shrink-0" onClick={() => complete.mutate()} disabled={complete.isPending}>
        <CheckCircle2 className="h-4 w-4" />
        {complete.isPending ? "Сохраняем…" : "Урок пройден"}
      </Button>
    </div>
  );
}
