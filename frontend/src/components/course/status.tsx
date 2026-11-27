import { CheckCircle2, FileText, Lock, PlayCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LessonBrief } from "@/types";

export const isLocked = (l: Pick<LessonBrief, "status">) =>
  l.status === "locked_payment" || l.status === "locked_sequence";

/** Иконка урока по статусу: пройден / открыт / закрыт. */
export function LessonIcon({ lesson, className }: { lesson: LessonBrief; className?: string }) {
  if (lesson.status === "completed") return <CheckCircle2 className={cn("text-sage", className)} />;
  if (isLocked(lesson)) return <Lock className={className} />;
  const Icon = lesson.has_video ? PlayCircle : FileText;
  return <Icon className={className} />;
}

export function lessonHint(lesson: LessonBrief): string {
  switch (lesson.status) {
    case "completed":
      return "Пройден";
    case "locked_payment":
      return "Модуль не оплачен";
    case "locked_sequence":
      return "Откроется после предыдущего урока";
    default:
      return lesson.is_free ? "Бесплатный урок" : lesson.has_video ? "Видеоурок" : "Урок";
  }
}
