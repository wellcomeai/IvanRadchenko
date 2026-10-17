"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { MailCheck } from "lucide-react";

import { AltchaCheck } from "@/components/auth/AltchaCheck";
import { AuthCard, authLinkClass } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth";
import { useAuthConfig } from "@/hooks/useAuthConfig";

const schema = z.object({ email: z.string().email("Введите корректный email") });
type FormValues = z.infer<typeof schema>;

const backToLogin = (
  <Link href="/login" className={authLinkClass}>
    ← Назад ко входу
  </Link>
);

export default function ForgotPasswordPage() {
  const { data: config } = useAuthConfig();
  const [sent, setSent] = useState(false);
  const [altcha, setAltcha] = useState<string | null>(null);
  const [altchaKey, setAltchaKey] = useState(0);
  const needsCaptcha = config?.captcha === "altcha";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await authApi.forgotPassword(values.email, altcha ?? undefined);
      setSent(true);
    } catch (e) {
      const err = e as AxiosError<{ detail?: string }>;
      toast.error(err.response?.data?.detail ?? "Не удалось отправить письмо");
      setAltchaKey((k) => k + 1);
    }
  }

  // Почта на сайте не настроена — письмо отправить нечем.
  if (config && !config.email_enabled) {
    return (
      <AuthCard
        title="Восстановление пароля"
        description="На этом сайте пока не настроена отправка писем, поэтому сбросить пароль по ссылке нельзя. Напишите администратору сайта — он поможет восстановить доступ."
        footer={backToLogin}
      />
    );
  }

  if (sent) {
    return (
      <AuthCard
        title="Проверьте почту"
        description="Если такой email зарегистрирован, мы отправили на него ссылку для сброса пароля. Письмо может попасть в «Спам»."
        footer={backToLogin}
        icon={<MailCheck className="h-6 w-6" strokeWidth={1.75} />}
      />
    );
  }

  return (
    <AuthCard
      title="Восстановление пароля"
      description="Введите email, и мы пришлём ссылку для сброса пароля."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        {needsCaptcha && <AltchaCheck key={altchaKey} onChange={setAltcha} />}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || !config || (needsCaptcha && !altcha)}
        >
          {isSubmitting ? "Отправляем…" : "Отправить ссылку"}
        </Button>
      </form>
    </AuthCard>
  );
}
