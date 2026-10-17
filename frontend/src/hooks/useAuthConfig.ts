"use client";

import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/api/auth";

/** Что включено на сервере: почта (подтверждение, сброс пароля) и капча. */
export function useAuthConfig() {
  return useQuery({
    queryKey: ["auth-config"],
    queryFn: () => authApi.config(),
    staleTime: 5 * 60 * 1000,
  });
}
