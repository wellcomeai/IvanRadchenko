"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth";

const schema = z
  .object({
    password: z.string().min(8, "Минимум 8 символов"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Пароли не совпадают",
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    if (!token) {
      toast.error("Не указан токен в URL");
      return;
    }
    try {
      await authApi.resetPassword(token, values.password);
      toast.success("Пароль обновлён. Войдите с новым паролем.");
      router.push("/login");
    } catch (e) {
      const err = e as AxiosError<{ detail?: string }>;
      toast.error(err.response?.data?.detail ?? "Не удалось сбросить пароль");
    }
  }

  return (
    <AuthCard title="Новый пароль" description="Придумайте новый пароль для входа.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Новый пароль</Label>
          <Input id="password" type="password" autoComplete="new-password" placeholder="Минимум 8 символов" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Повторите пароль</Label>
          <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" {...register("confirm")} />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем…" : "Сохранить пароль"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
<AuthCard title="Новый пароль" />
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
