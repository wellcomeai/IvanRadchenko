"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FilePlus2,
  FileText,
  Loader2,
  Pencil,
  PlayCircle,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ModuleSelect, Switch } from "@/components/course/form";
import { adminCourseApi } from "@/api/course";
import { cn, errorMessage, formatBytes } from "@/lib/utils";
import type { LessonMaterial, MaterialKind } from "@/types";

interface UploadTask {
  key: string;
  name: string;
  size: number;
  progress: number;
  controller: AbortController;
}

export default function AdminLessonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: lesson, isLoading, isError } = useQuery({
    queryKey: ["admin-lesson", id],
    queryFn: () => adminCourseApi.lesson(id),
  });
  const { data: modules } = useQuery({
    queryKey: ["admin-course"],
    queryFn: () => adminCourseApi.modules(),
  });
  const { data: storage } = useQuery({
    queryKey: ["admin-course-storage"],
    queryFn: () => adminCourseApi.storage(),
  });

  const [form, setForm] = useState({ module_id: "", title: "", description: "", is_published: false });
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (lesson && loadedId !== lesson.id) {
    setLoadedId(lesson.id);
    setForm({
      module_id: lesson.module_id,
      title: lesson.title,
      description: lesson.description,
      is_published: lesson.is_published,
    });
  }
  const dirty =
    !!lesson &&
    (form.module_id !== lesson.module_id ||
      form.title !== lesson.title ||
      form.description !== lesson.description ||
      form.is_published !== lesson.is_published);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-lesson", id] });
    qc.invalidateQueries({ queryKey: ["admin-course"] });
    qc.invalidateQueries({ queryKey: ["course-modules"] });
    qc.invalidateQueries({ queryKey: ["lesson", id] });
  };

  const save = useMutation({
    mutationFn: () => adminCourseApi.updateLesson(id, { ...form, title: form.title.trim() }),
    onSuccess: (updated) => {
      qc.setQueryData(["admin-lesson", id], updated);
      setLoadedId(null); // перечитать форму из ответа
      refresh();
      toast.success("Урок сохранён");
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось сохранить")),
  });

  const removeLesson = useMutation({
    mutationFn: () => adminCourseApi.deleteLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-course"] });
      qc.invalidateQueries({ queryKey: ["course-modules"] });
      toast.success("Урок удалён");
      router.push("/admin/course");
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось удалить урок")),
  });

  // ---------- Загрузки ----------
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const videoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Не дать случайно закрыть вкладку посреди загрузки.
  useEffect(() => {
    if (uploads.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [uploads.length]);

  const startUpload = async (file: File, kind: MaterialKind) => {
    if (kind === "video" && !file.type.startsWith("video/")) {
      toast.error(`«${file.name}» — не видеофайл. Загрузите видео, лучше в формате MP4`);
      return;
    }
    const task: UploadTask = {
      key: `${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      progress: 0,
      controller: new AbortController(),
    };
    setUploads((u) => [...u, task]);
    try {
      await adminCourseApi.upload(
        id,
        file,
        kind,
        (progress) =>
          setUploads((u) => u.map((t) => (t.key === task.key ? { ...t, progress } : t))),
        task.controller.signal,
      );
      toast.success(`«${file.name}» загружен`);
    } catch (e) {
      if (!task.controller.signal.aborted) {
        toast.error(errorMessage(e, `Не удалось загрузить «${file.name}»`));
      }
    } finally {
      setUploads((u) => u.filter((t) => t.key !== task.key));
      refresh();
    }
  };

  const onPick = (kind: MaterialKind) => (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach((f) => void startUpload(f, kind));
    e.target.value = "";
  };

  const removeMaterial = useMutation({
    mutationFn: (m: LessonMaterial) => adminCourseApi.deleteMaterial(m.id),
    onSuccess: () => {
      toast.success("Файл удалён");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось удалить файл")),
  });

  const rename = useMutation({
    mutationFn: ({ m, title }: { m: LessonMaterial; title: string }) =>
      adminCourseApi.renameMaterial(m.id, title),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e, "Не удалось переименовать")),
  });

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (isError || !lesson) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Урок не найден.</p>
        <Button asChild variant="outline">
          <Link href="/admin/course">К списку уроков</Link>
        </Button>
      </div>
    );
  }

  const materials = lesson.materials.filter((m) => m.is_uploaded);
  const storageOff = storage && !storage.enabled;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/course"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Все уроки
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link href={`/lessons/${lesson.id}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            Посмотреть как ученик
          </Link>
        </Button>
      </div>

      <h1 className="font-display text-[26px] leading-tight sm:text-[30px]">{lesson.title}</h1>

      {/* Текст урока */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.title.trim()) save.mutate();
          }}
        >
          <div className="grid gap-5 md:grid-cols-[1fr_280px]">
            <div className="space-y-1.5">
              <Label htmlFor="title">Название урока</Label>
              <Input
                id="title"
                required
                maxLength={255}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="module">Модуль</Label>
              {modules && (
                <ModuleSelect
                  id="module"
                  modules={modules}
                  value={form.module_id}
                  onChange={(module_id) => setForm((f) => ({ ...f, module_id }))}
                />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Описание урока</Label>
            <Textarea
              id="description"
              rows={8}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Что ученик узнает, ключевые мысли, домашнее задание"
            />
            <p className="text-xs text-muted-foreground">
              Переносы строк сохраняются. Пустая строка — новый абзац.
            </p>
          </div>
          <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Switch
              checked={form.is_published}
              onChange={(is_published) => setForm((f) => ({ ...f, is_published }))}
              label="Опубликован"
              hint="Ученики видят только опубликованные уроки"
            />
            <Button type="submit" disabled={!dirty || save.isPending || !form.title.trim()}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Сохранить
            </Button>
          </div>
        </form>
      </section>

      {/* Видео и файлы */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg">Видео и материалы</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Видео лучше загружать в MP4 (H.264) — оно открывается во всех браузерах и на телефонах.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <input ref={videoInput} type="file" accept="video/*" multiple hidden onChange={onPick("video")} />
            <input ref={fileInput} type="file" multiple hidden onChange={onPick("file")} />
            <Button disabled={storageOff} onClick={() => videoInput.current?.click()}>
              <Upload className="h-4 w-4" />
              Видео
            </Button>
            <Button variant="outline" disabled={storageOff} onClick={() => fileInput.current?.click()}>
              <FilePlus2 className="h-4 w-4" />
              Файл
            </Button>
          </div>
        </div>

        {storageOff && (
          <p className="mt-4 rounded-xl bg-gold-soft/70 px-4 py-3 text-sm">
            Хранилище для видео ещё не подключено — загрузка станет доступна после настройки S3.
          </p>
        )}

        <div className="mt-5 space-y-3">
          {uploads.map((t) => (
            <div key={t.key} className="rounded-xl border border-clay/30 bg-clay-soft/40 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{t.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  {t.progress}% из {formatBytes(t.size)}
                  <button
                    type="button"
                    aria-label="Отменить загрузку"
                    className="rounded p-1 hover:bg-black/5"
                    onClick={() => t.controller.abort()}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-clay transition-[width] duration-300"
                  style={{ width: `${t.progress}%` }}
                />
              </div>
            </div>
          ))}

          {materials.length === 0 && uploads.length === 0 && (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Пока ничего не загружено
            </div>
          )}

          {materials.map((m) => (
            <MaterialRow
              key={m.id}
              material={m}
              onRename={(title) => rename.mutate({ m, title })}
              onDelete={() => {
                if (window.confirm(`Удалить «${m.title}»? Файл будет удалён из хранилища.`)) {
                  removeMaterial.mutate(m);
                }
              }}
            />
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:border-destructive"
          disabled={removeLesson.isPending}
          onClick={() => {
            if (window.confirm(`Удалить урок «${lesson.title}» вместе со всеми видео и файлами?`)) {
              removeLesson.mutate();
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
          Удалить урок
        </Button>
      </div>
    </>
  );
}

function MaterialRow({
  material: m,
  onRename,
  onDelete,
}: {
  material: LessonMaterial;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(m.title);
  const [preview, setPreview] = useState(false);
  const Icon = m.kind === "video" ? PlayCircle : FileText;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            m.kind === "video" ? "bg-[#0f1e3d] text-gold" : "bg-clay-soft text-clay",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (title.trim()) {
                  onRename(title.trim());
                  setEditing(false);
                }
              }}
            >
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" autoFocus />
              <Button type="submit" size="sm">
                ОК
              </Button>
            </form>
          ) : (
            <>
              <div className="truncate text-sm font-medium">{m.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {m.kind === "video" ? "Видео" : "Файл"} · {m.filename} · {formatBytes(m.size_bytes)}
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {m.kind === "video" && m.url && (
            <Button variant="ghost" size="sm" onClick={() => setPreview((v) => !v)}>
              {preview ? "Скрыть" : "Смотреть"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Переименовать"
            onClick={() => {
              setTitle(m.title);
              setEditing((v) => !v);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Удалить"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {preview && m.url && (
        <video src={m.url} controls preload="metadata" className="mt-3 aspect-video w-full rounded-lg bg-black" />
      )}
    </div>
  );
}
