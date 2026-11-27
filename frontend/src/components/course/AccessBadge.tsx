import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { StudentRow } from "@/types";

/** Что у ученика оплачено: весь курс / номера модулей / ничего. */
export function AccessBadge({ row }: { row: StudentRow }) {
  if (row.full_course_until)
    return <Badge variant="success">Весь курс до {formatDate(row.full_course_until)}</Badge>;
  if (row.modules_paid.length)
    return <Badge variant="secondary">Модули: {row.modules_paid.join(", ")}</Badge>;
  return <span className="text-xs text-muted-foreground">Не оплачен</span>;
}
