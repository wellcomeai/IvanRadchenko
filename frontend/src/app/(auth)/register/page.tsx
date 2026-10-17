"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";

import { AltchaCheck } from "@/components/auth/AltchaCheck";
import { AuthCard, authLinkClass } from "@/components/auth/AuthCard";
import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated";
import { VerifyCodeForm } from "@/components/auth/VerifyCodeForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useAuthConfig } from "@/hooks/useAuthConfig";

const schema = z
  .object({
    first_name: z.string().min(1, "Обязательное поле").max(100),
    last_name: z.string().min(1, "Обязательное поле").max(100),
    email: z.string().email("Введите корректный email"),
    password: z.string().min(8, "Минимум 8 символов"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Пароли не совпадают",
  });

type FormValues = z.infer<typeof schema>;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const ERRORS: Record<string, string> = {
  "Email already registered": "Этот email уже зарегистрирован. Попробуйте войти.",
};

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { data: config } = useAuthConfig();
  const [refCode, setRefCode] = useState<string | null>(null);
  const [pending, setPending] = useState<{ userId: string; email: string } | null>(null);
  const [altcha, setAltcha] = useState<string | null>(null);
  // Решение ALTCHA одноразовое: после ошибки просим компонент решить новую задачу.
  const [altchaKey, setAltchaKey] = useState(0);
  const needsCaptcha = config?.captcha === "altcha";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    setRefCode(readCookie("referral_code"));
  }, []);

  async function onSubmit(values: FormValues) {
    try {
      const res = await registerUser(
        values.email,
        values.password,
        values.first_name,
        values.last_name,
        refCode ?? undefined,
        altcha ?? undefined,
      );
      if (res.pendingVerification) {
        setPending({ userId: res.userId, email: values.email });
      }
    } catch (e) {
      const err = e as AxiosError<{ detail?: string }>;
      const detail = err.response?.data?.detail;
      toast.error((detail && ERRORS[detail]) ?? detail ?? "Не удалось зарегистрироваться");
      setAltchaKey((k) => k + 1);
    }
  }

  if (pending) {
    return <VerifyCodeForm userId={pending.userId} email={pending.email} />;
  }

  const waitingCaptcha = needsCaptcha && !altcha;

  return (
    <AuthCard
      title="Создать аккаунт"
      description="3 дня бесплатно, без привязки карты."
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link href="/login" className={authLinkClass}>
            Войти
          </Link>
        </>
      }
    >
      <RedirectIfAuthenticated />
      {refCode && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-clay-soft px-3.5 py-2.5 text-sm text-clay-ink">
          <Gift className="h-4 w-4 shrink-0" />
          <span>
            Вас пригласили по коду <span className="font-mono font-medium">{refCode}</span>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">Имя</Label>
            <Input id="first_name" autoComplete="given-name" placeholder="Иван" {...register("first_name")} />
            {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Фамилия</Label>
            <Input id="last_name" autoComplete="family-name" placeholder="Иванов" {...register("last_name")} />
            {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Минимум 8 символов"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Повторите пароль</Label>
          <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" {...register("confirm")} />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>

        {needsCaptcha && <AltchaCheck key={altchaKey} onChange={setAltcha} />}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || waitingCaptcha || !config}
        >
          {isSubmitting ? "Создаём аккаунт…" : "Создать аккаунт"}
        </Button>
      </form>
    </AuthCard>
  );
}
