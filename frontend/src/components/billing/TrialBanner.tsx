"use client";

import Link from "next/link";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { cn } from "@/lib/utils";

export function TrialBanner({ showLink = true }: { showLink?: boolean }) {
  const { isTrial, daysLeft, isExpired } = useTrialStatus();

  if (!isTrial) return null;

  const isUrgent = !isExpired && daysLeft <= 1;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        isExpired
          ? "border-destructive/30 bg-destructive/5"
          : isUrgent
            ? "border-clay/30 bg-clay-soft/60"
            : "border-border bg-card",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            isExpired ? "bg-destructive/10 text-destructive" : "bg-secondary text-clay",
          )}
        >
          <Clock className="h-4 w-4" />
        </span>
        <div className="text-sm">
          {isExpired ? (
            <span className="font-medium">
              Пробный период закончился: выберите тариф, чтобы продолжить
            </span>
          ) : (
            <>
              <span className="font-medium">
                Пробный период,{" "}
                {daysLeft === 0
                  ? "последний день"
                  : `осталось ${daysLeft} дн.`}
              </span>
              <span className="text-muted-foreground sm:ml-2 max-sm:block">
                Выберите тариф, чтобы не потерять доступ.
              </span>
            </>
          )}
        </div>
      </div>
      {showLink && (
        <Link href="/billing">
          <Button size="sm" variant={isExpired ? "default" : "outline"}>
            Выбрать тариф
          </Button>
        </Link>
      )}
    </div>
  );
}
