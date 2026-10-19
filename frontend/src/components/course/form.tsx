"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { AdminCourseModule } from "@/types";

/** Переключатель «да/нет» (например, «Опубликован»). */
export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          checked ? "bg-clay" : "bg-input",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

/** Выбор модуля для урока. */
export function ModuleSelect({
  modules,
  value,
  onChange,
  id,
}: {
  modules: Pick<AdminCourseModule, "id" | "position" | "title">[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-[15px] transition-colors hover:border-foreground/25 focus-visible:border-clay focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clay/15"
    >
      {modules.map((m) => (
        <option key={m.id} value={m.id}>
          {m.position}. {m.title}
        </option>
      ))}
    </select>
  );
}
