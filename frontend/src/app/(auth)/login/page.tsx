"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { AuthCard, authLinkClass } from "@/components/auth/AuthCard";
import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    try {
      await login(values.email, values.password);
    } catch (e) {
      const err = e as AxiosError<{ detail?: string }>;
      const detail = err.response?.data?.detail;
      toast.error(detail === "Invalid credentials" ? "Неверный email или пароль" : detail ?? "Не удалось войти");
    }
  }

  return (
    <AuthCard
      title="С возвращением"
      description="Войдите, чтобы продолжить работу."
      footer={
        <>
          Нет аккаунта?{" "}
          <Link href="/register" className={authLinkClass}>
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <RedirectIfAuthenticated />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Пароль</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-clay">
              Забыли пароль?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Входим…" : "Войти"}
        </Button>
      </form>
    </AuthCard>
  );
}
