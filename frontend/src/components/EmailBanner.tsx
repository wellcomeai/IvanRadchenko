"use client";

import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authApi } from "@/api/auth";
import { useAuthConfig } from "@/hooks/useAuthConfig";
import { useAuthStore } from "@/store/authStore";

/** Напоминание подтвердить email. Без настроенной почты не показывается. */
export function EmailBanner() {
  const user = useAuthStore((s) => s.user);
  const { data: config } = useAuthConfig();

  if (!user || user.is_email_verified || !config?.email_enabled) return null;

  async function resend() {
    if (!user) return;
    try {
      await authApi.resendConfirmation(user.email);
      toast.success("Письмо отправлено. Проверьте почту.");
    } catch {
      toast.error("Не удалось отправить письмо");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-clay/25 bg-clay-soft/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-foreground">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-clay">
          <Mail className="h-4 w-4" />
        </span>
        <span>Подтвердите email: без этого не получится создать API-ключ.</span>
      </div>
      <Button size="sm" variant="outline" onClick={resend}>
        Отправить письмо ещё раз
      </Button>
    </div>
  );
}
