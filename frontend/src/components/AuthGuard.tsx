"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, isLoading, connectionError, retry } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || connectionError) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requireAdmin && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [isLoading, connectionError, user, requireAdmin, router]);

  if (connectionError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-clay">
          <WifiOff className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <div>
          <p className="font-display text-lg">Не удаётся связаться с сервером</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Вы по-прежнему в аккаунте. Проверьте интернет и попробуйте ещё раз.
          </p>
        </div>
        <Button onClick={retry}>Повторить</Button>
      </div>
    );
  }

  if (isLoading || !user || (requireAdmin && user.role !== "admin")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-clay" />
      </div>
    );
  }

  return <>{children}</>;
}
