"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle, Lock } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { AccessBadge } from "@/components/course/AccessBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { adminCourseApi } from "@/api/course";
import { cn, errorMessage, formatDate, formatDateTime } from "@/lib/utils";
import type { LessonStatus } from "@/types";

const STATUS: Record<LessonStatus, { label: string; cls: string }> = {
  completed: { label: "Пройден", cls: "text-sage" },
  available: { label: "Открыт", cls: "text-clay" },
  locked_sequence: { label: "Ждёт предыдущий", cls: "text-muted-foreground" },
  locked_payment: { label: "Не оплачен", cls: "text-muted-foreground" },
};

function StatusIcon({ status }: { status: LessonStatus }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-sage" />;
  if (status === "available") return <Circle className="h-4 w-4 text-clay" />;
  return <Lock className="h-4 w-4 text-muted-foreground" />;
}

export default function AdminStudentPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-student", id],
    queryFn: () => adminCourseApi.student(id),
  });
  const { data: settings } = useQuery({
    queryKey: ["admin-course-settings"],
    queryFn: () => adminCourseApi.settings(),
  });

  const [target, setTarget] = useState("course");
  const [days, setDays] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-student", id] });
    qc.invalidateQueries({ queryKey: ["admin-students"] });
  };

  const grant = useMutation({
    mutationFn: () =>
      adminCourseApi.grant(id, target === "course" ? null : target, days ? Number(days) : undefined),
    onSuccess: () => {
      toast.success("Доступ выдан");
      setDays("");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось выдать доступ")),
  });

  const revoke = useMutation({
    mutationFn: (accessId: string) => adminCourseApi.revoke(accessId),
    onSuccess: () => {
      toast.success("Доступ отозван");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e, "Не удалось отозвать доступ")),
  });

  if (isLoading || !data) return <Skeleton className="h-96 rounded-2xl" />;
  const { row } = data;

  return (
    <>
      <Link href="/admin/students" className="flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Все ученики
      </Link>
      <PageHeader title={row.name || row.email} description={row.name ? row.email : undefined} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Доступ</div>
          <div className="mt-2">
            <AccessBadge row={row} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Пройдено уроков</div>
          <div className="mt-1 font-display text-2xl">
            {row.completed_lessons} <span className="text-base text-muted-foreground">из {row.total_lessons}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Был на сайте</div>
          <div className="mt-1 text-sm">
            {row.last_activity_at ? formatDateTime(row.last_activity_at) : "ещё не занимался"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Зарегистрирован {formatDate(row.created_at)}</div>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-[17px]">Выдать доступ вручную</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Например, если ученик оплатил переводом или получил курс в подарок. Если такой доступ уже есть, новый
          начнётся после окончания текущего.
        </p>
        <form
          className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            grant.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="g-target">Что открыть</Label>
            <select
              id="g-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-72"
            >
              <option value="course">Весь курс</option>
              {data.modules.map((m) => (
                <option key={m.id} value={m.id}>
                  Модуль {m.position}. {m.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-days">На сколько дней</Label>
            <Input
              id="g-days"
              type="number"
              min={1}
              max={3650}
              placeholder={settings ? String(settings.access_days) : "365"}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="sm:w-40"
            />
          </div>
          <Button type="submit" disabled={grant.isPending}>
            {grant.isPending ? "Выдаём…" : "Выдать доступ"}
          </Button>
        </form>

        {data.accesses.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 font-medium">Что</th>
                  <th className="py-2 font-medium">Период</th>
                  <th className="py-2 font-medium">Откуда</th>
                  <th className="py-2 font-medium">Статус</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.accesses.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-2.5">{a.module_position ? `Модуль ${a.module_position}` : "Весь курс"}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      {formatDate(a.starts_at)} — {formatDate(a.expires_at)}
                    </td>
                    <td className="py-2.5">{a.source === "payment" ? "Оплата" : "Выдан вручную"}</td>
                    <td className="py-2.5">
                      {a.revoked_at ? (
                        <Badge variant="destructive">Отозван</Badge>
                      ) : a.is_active ? (
                        <Badge variant="success">Действует</Badge>
                      ) : new Date(a.starts_at) > new Date() ? (
                        <Badge variant="secondary">Продление</Badge>
                      ) : (
                        <Badge variant="secondary">Истёк</Badge>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      {!a.revoked_at && new Date(a.expires_at) > new Date() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={revoke.isPending}
                          onClick={() => {
                            if (confirm("Отозвать этот доступ? Ученик потеряет доступ к урокам.")) revoke.mutate(a.id);
                          }}
                        >
                          Отозвать
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg">Прогресс по урокам</h2>
        {data.modules.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
              <div className="font-medium">
                Модуль {m.position}. {m.title}
              </div>
              <span className="text-xs text-muted-foreground">
                {m.access_until ? `Доступ до ${formatDate(m.access_until)}` : "Не оплачен"}
              </span>
            </div>
            {m.lessons.length === 0 ? (
              <div className="px-5 py-3 text-sm text-muted-foreground">Уроков пока нет</div>
            ) : (
              <ul className="divide-y divide-border">
                {m.lessons.map((l, i) => (
                  <li key={l.id} className="flex flex-col gap-1 px-5 py-2.5 text-sm sm:flex-row sm:items-center sm:gap-4">
                    <span className="flex min-w-0 flex-1 items-center gap-2.5">
                      <StatusIcon status={l.status} />
                      <span className="truncate">
                        {i + 1}. {l.title}
                      </span>
                    </span>
                    <span className={cn("text-xs sm:w-36", STATUS[l.status].cls)}>{STATUS[l.status].label}</span>
                    <span className="text-xs text-muted-foreground sm:w-56 sm:text-right">
                      {l.completed_at
                        ? `пройден ${formatDateTime(l.completed_at)}`
                        : l.last_opened_at
                          ? `открывал ${formatDateTime(l.last_opened_at)}`
                          : "не открывал"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
