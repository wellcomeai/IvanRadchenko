"use client";

import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { usePayments } from "@/hooks/useBilling";

const statusLabel: Record<string, string> = {
  success: "Оплачен",
  pending: "Не оплачен",
  failed: "Ошибка",
  refunded: "Возврат",
};

const statusVariant: Record<
  string,
  "default" | "success" | "destructive" | "secondary" | "warning"
> = {
  success: "success",
  pending: "warning",
  failed: "destructive",
  refunded: "secondary",
};

export function PaymentHistory() {
  const { data: all, isLoading } = usePayments();
  // Незавершённые попытки оплаты (ушёл со страницы Робокассы) не показываем.
  const data = all?.filter((p) => p.status !== "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle>История платежей</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="Платежей пока нет"
            description="После оплаты курса или модуля история появится здесь"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Дата</th>
                  <th className="py-2">Сумма</th>
                  <th className="py-2">Что оплачено</th>
                  <th className="py-2">Статус</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3">{formatDateTime(p.created_at)}</td>
                    <td className="py-3">{formatMoney(p.amount, p.currency)}</td>
                    <td className="py-3">{p.title}</td>
                    <td className="py-3">
                      <Badge variant={statusVariant[p.status] ?? "default"}>
                        {statusLabel[p.status] ?? p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
