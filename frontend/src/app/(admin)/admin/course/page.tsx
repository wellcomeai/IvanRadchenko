"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ModuleSelect, Switch } from "@/components/course/form";
import { adminCourseApi } from "@/api/course";
import { errorMessage, formatMoney } from "@/lib/utils";
import type { AdminCourseModule, Lesson } from "@/types";

export default function AdminCoursePage() {
  const qc = useQueryClient();
  const { data: modules, isLoading } = useQuery({
    queryKey: ["admin-course"],
    queryFn: () => adminCourseApi.modules(),
  });
  const { data: storage } = useQuery({
    queryKey: ["admin-course-storage"],
    queryFn: () => adminCourseApi.storage(),
  });

  const [newLessonModule, setNewLessonModule] = useState<string | null>(null);
  const [editModule, setEditModule] = useState<AdminCourseModule | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-course"] });
    qc.invalidateQueries({ queryKey: ["course-modules"] });
  };

  const togglePublish = useMutation({
    mutationFn: (l: Lesson) => adminCourseApi.updateLesson(l.id, { is_published: !l.is_published }),
    onSuccess: (l) => {
      toast.success(l.is_published ? "Урок опубликован" : "Урок скрыт от учеников");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось сохранить")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminCourseApi.deleteLesson(id),
    onSuccess: () => {
      toast.success("Урок удалён");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось удалить урок")),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => adminCourseApi.reorderLessons(ids),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e, "Не удалось изменить порядок")),
  });

  const move = (m: AdminCourseModule, index: number, delta: number) => {
    const ids = m.lessons.map((l) => l.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };

  return (
    <>
      <PageHeader
        title="Управление курсом"
        description="Модули, уроки, видео и материалы. Черновики видите только вы."
        actions={
          modules && (
            <Button onClick={() => setNewLessonModule(modules[0]?.id ?? null)}>
              <Plus className="h-4 w-4" />
              Добавить урок
            </Button>
          )
        }
      />

      {storage && !storage.enabled && (
        <div className="flex gap-3 rounded-2xl border border-gold/40 bg-gold-soft/60 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <div>
            <div className="font-medium">Хранилище для видео не подключено</div>
            <div className="text-muted-foreground">
              Уроки и описания можно создавать уже сейчас, а загрузка видео заработает после
              подключения S3-хранилища Timeweb (переменные S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY).
            </div>
          </div>
        </div>
      )}

      <PricingCard />

      {isLoading &&
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}

      {modules?.map((m) => (
        <section key={m.id} className="rounded-2xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f1e3d] font-display text-sm text-gold">
                {m.position}
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-[17px] leading-snug">
                  {m.title}
                  <span className="ml-2 align-middle font-body text-sm font-normal text-muted-foreground">
                    · {formatMoney(m.price)}
                  </span>
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {m.description || "Без описания"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditModule(m)}>
                <Pencil className="h-3.5 w-3.5" />
                Модуль
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setNewLessonModule(m.id)}>
                <Plus className="h-3.5 w-3.5" />
                Урок
              </Button>
            </div>
          </div>

          {m.lessons.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted-foreground">В модуле пока нет уроков.</div>
          ) : (
            <ul className="divide-y divide-border">
              {m.lessons.map((l, i) => {
                const videos = l.materials.filter((x) => x.kind === "video" && x.is_uploaded).length;
                const files = l.materials.filter((x) => x.kind === "file" && x.is_uploaded).length;
                return (
                  <li key={l.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="w-6 shrink-0 text-center font-display text-sm text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/course/lessons/${l.id}`}
                          className="font-medium text-foreground no-underline hover:text-clay"
                        >
                          {l.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {l.is_published ? (
                            <Badge variant="success">Опубликован</Badge>
                          ) : (
                            <Badge variant="secondary">Черновик</Badge>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <PlayCircle className="h-3 w-3" />
                            {videos ? `видео: ${videos}` : "без видео"}
                          </span>
                          {files > 0 && <span>файлов: {files}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 pl-9 sm:pl-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Выше"
                        disabled={i === 0 || reorder.isPending}
                        onClick={() => move(m, i, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Ниже"
                        disabled={i === m.lessons.length - 1 || reorder.isPending}
                        onClick={() => move(m, i, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={l.is_published ? "Скрыть" : "Опубликовать"}
                        title={l.is_published ? "Скрыть от учеников" : "Опубликовать"}
                        onClick={() => togglePublish.mutate(l)}
                      >
                        {l.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button asChild variant="ghost" size="icon" aria-label="Редактировать">
                        <Link href={`/admin/course/lessons/${l.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Удалить"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Удалить урок «${l.title}» вместе со всеми видео и файлами? Это нельзя отменить.`,
                            )
                          ) {
                            remove.mutate(l.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}

      {modules && (
        <NewLessonDialog
          modules={modules}
          moduleId={newLessonModule}
          onClose={() => setNewLessonModule(null)}
        />
      )}
      <EditModuleDialog module={editModule} onClose={() => setEditModule(null)} onSaved={refresh} />
    </>
  );
}

function NewLessonDialog({
  modules,
  moduleId,
  onClose,
}: {
  modules: AdminCourseModule[];
  moduleId: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({ module_id: "", title: "", description: "", is_published: false });
  const open = moduleId !== null;

  // При каждом открытии — чистая форма с выбранным модулем.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (moduleId !== null && openedFor !== moduleId) {
    setOpenedFor(moduleId);
    setForm({ module_id: moduleId, title: "", description: "", is_published: false });
  }
  if (!open && openedFor !== null) setOpenedFor(null);

  const create = useMutation({
    mutationFn: () => adminCourseApi.createLesson(form),
    onSuccess: (lesson) => {
      qc.invalidateQueries({ queryKey: ["admin-course"] });
      qc.invalidateQueries({ queryKey: ["course-modules"] });
      toast.success("Урок создан — теперь загрузите видео");
      onClose();
      router.push(`/admin/course/lessons/${lesson.id}`);
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось создать урок")),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">Новый урок</DialogTitle>
          <DialogDescription>Видео и файлы добавите на следующем шаге.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.title.trim()) create.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="nl-module">Модуль</Label>
            <ModuleSelect
              id="nl-module"
              modules={modules}
              value={form.module_id}
              onChange={(module_id) => setForm((f) => ({ ...f, module_id }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nl-title">Название урока</Label>
            <Input
              id="nl-title"
              autoFocus
              required
              maxLength={255}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Например: Как устроены деньги"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nl-desc">Описание</Label>
            <Textarea
              id="nl-desc"
              rows={5}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="О чём урок, что ученик узнает и что сделает после просмотра"
            />
          </div>
          <Switch
            checked={form.is_published}
            onChange={(is_published) => setForm((f) => ({ ...f, is_published }))}
            label="Сразу опубликовать"
            hint="Иначе урок сохранится черновиком и ученики его не увидят"
          />
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={create.isPending || !form.title.trim()}>
              {create.isPending ? "Создаём…" : "Создать урок"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditModuleDialog({
  module: mod,
  onClose,
  onSaved,
}: {
  module: AdminCourseModule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ title: "", description: "", price: "" });
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (mod && openedFor !== mod.id) {
    setOpenedFor(mod.id);
    setForm({ title: mod.title, description: mod.description, price: String(Number(mod.price)) });
  }
  if (!mod && openedFor !== null) setOpenedFor(null);

  const save = useMutation({
    mutationFn: () =>
      adminCourseApi.updateModule(mod!.id, {
        title: form.title,
        description: form.description,
        price: Number(form.price),
      }),
    onSuccess: () => {
      toast.success("Модуль сохранён");
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось сохранить")),
  });

  return (
    <Dialog open={mod !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">Модуль {mod?.position}</DialogTitle>
          <DialogDescription>Название и описание видят ученики и посетители главной страницы.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.title.trim() && Number(form.price) >= 1) save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="em-title">Название</Label>
            <Input
              id="em-title"
              required
              maxLength={255}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em-desc">Описание</Label>
            <Textarea
              id="em-desc"
              rows={5}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em-price">Цена модуля, ₽</Label>
            <Input
              id="em-price"
              type="number"
              min={1}
              step={1}
              required
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Цена при покупке этого модуля отдельно. Модули покупаются по порядку.
            </p>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={save.isPending || !form.title.trim() || Number(form.price) < 1}>
              {save.isPending ? "Сохраняем…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Цена всего курса и срок доступа. Цены модулей — в карточке каждого модуля. */
function PricingCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-course-settings"], queryFn: () => adminCourseApi.settings() });
  const [form, setForm] = useState<{ full_price: string; access_days: string } | null>(null);
  if (data && form === null) {
    setForm({ full_price: String(Number(data.full_price)), access_days: String(data.access_days) });
  }

  const save = useMutation({
    mutationFn: () =>
      adminCourseApi.updateSettings({
        full_price: Number(form!.full_price),
        access_days: Number(form!.access_days),
      }),
    onSuccess: () => {
      toast.success("Цены сохранены");
      qc.invalidateQueries({ queryKey: ["admin-course-settings"] });
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось сохранить")),
  });

  const valid = form && Number(form.full_price) >= 1 && Number(form.access_days) >= 1;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-[17px]">Стоимость курса</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ученик покупает весь курс сразу или модули по одному, по порядку. Цену модуля меняйте кнопкой
        «Модуль» в карточке модуля.
      </p>
      {!form ? (
        <Skeleton className="mt-4 h-16" />
      ) : (
        <form
          className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="cs-price">Весь курс, ₽</Label>
            <Input
              id="cs-price"
              type="number"
              min={1}
              step={1}
              value={form.full_price}
              onChange={(e) => setForm({ ...form, full_price: e.target.value })}
              className="sm:w-44"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cs-days">Срок доступа, дней</Label>
            <Input
              id="cs-days"
              type="number"
              min={1}
              max={3650}
              step={1}
              value={form.access_days}
              onChange={(e) => setForm({ ...form, access_days: e.target.value })}
              className="sm:w-44"
            />
          </div>
          <Button type="submit" disabled={!valid || save.isPending}>
            {save.isPending ? "Сохраняем…" : "Сохранить"}
          </Button>
        </form>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Срок действует и для курса, и для отдельных модулей. Уже оплаченные доступы не меняются.
      </p>
    </section>
  );
}
