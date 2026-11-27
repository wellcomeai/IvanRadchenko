"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, GraduationCap, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminCourseApi } from "@/api/course";
import { formatDateTime } from "@/lib/utils";
import { AccessBadge } from "@/components/course/AccessBadge";

const LIMIT = 50;

export default function AdminStudentsPage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-students", search, page],
    queryFn: () => adminCourseApi.students({ search: search || undefined, page }),
  });

  return (
    <>
      <PageHeader
        title="Ученики и прогресс"
        description="Что оплачено, сколько уроков пройдено и когда ученик занимался последний раз."
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск по email"
          className="pl-9"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : !data?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card">
          <EmptyState icon={GraduationCap} title="Учеников не найдено" description="Здесь появятся зарегистрированные ученики." />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Ученик</th>
                <th className="px-4 py-3 font-medium">Доступ</th>
                <th className="px-4 py-3 font-medium">Пройдено</th>
                <th className="px-4 py-3 font-medium">Последний урок</th>
                <th className="px-4 py-3 font-medium">Был на сайте</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((s) => {
                const pct = s.total_lessons ? Math.round((s.completed_lessons / s.total_lessons) * 100) : 0;
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/students/${s.id}`} className="font-medium text-foreground no-underline hover:underline">
                        {s.name || s.email}
                      </Link>
                      {s.name && <div className="text-xs text-muted-foreground">{s.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <AccessBadge row={s} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-sage" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="whitespace-nowrap">
                          {s.completed_lessons} из {s.total_lessons}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3" title={s.last_lesson_title ?? ""}>
                      {s.last_lesson_title ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {s.last_activity_at ? formatDateTime(s.last_activity_at) : "ещё не занимался"}
                    </td>
                    <td className="px-2 py-3">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/students/${s.id}`} aria-label="Подробнее">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={(data?.length ?? 0) < LIMIT}
          onClick={() => setPage((p) => p + 1)}
        >
          Дальше
        </Button>
      </div>
    </>
  );
}
