"use client";

import { useEffect, useState } from "react";

import { tokenStorage } from "@/api/client";

/**
 * Есть ли в браузере сохранённая сессия. Читается после монтирования,
 * чтобы разметка сервера и клиента совпадала.
 */
export function useHasSession(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    setHas(tokenStorage.hasSession);
  }, []);
  return has;
}
