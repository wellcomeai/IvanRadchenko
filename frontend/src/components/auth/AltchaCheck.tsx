"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, RotateCw, ShieldCheck } from "lucide-react";

import { authApi } from "@/api/auth";
import type { AltchaChallenge } from "@/types";

/**
 * Невидимая для человека проверка «не робот» (ALTCHA, proof-of-work).
 * Браузер сам решает небольшую задачу от сервера (~0.5 с), пока человек
 * заполняет форму. Ни ключей, ни внешних сервисов: см. backend/modules/auth/altcha.py.
 *
 * Решение одноразовое: после неудачной отправки формы смените `key`
 * компонента, и он решит новую задачу.
 */

const BATCH = 1000;

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function solve(c: AltchaChallenge, cancelled: () => boolean): Promise<number | null> {
  for (let start = 0; start <= c.maxnumber; start += BATCH) {
    if (cancelled()) return null;
    const end = Math.min(start + BATCH, c.maxnumber + 1);
    const hashes = await Promise.all(
      Array.from({ length: end - start }, (_, i) => sha256Hex(`${c.salt}${start + i}`)),
    );
    const found = hashes.indexOf(c.challenge);
    if (found !== -1) return start + found;
  }
  return null;
}

type Status = "solving" | "done" | "error";

export function AltchaCheck({ onChange }: { onChange: (payload: string | null) => void }) {
  const [status, setStatus] = useState<Status>("solving");
  const [attempt, setAttempt] = useState(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    setStatus("solving");
    onChangeRef.current(null);
    (async () => {
      try {
        const c = await authApi.altchaChallenge();
        const number = await solve(c, () => cancelled);
        if (cancelled) return;
        if (number === null) throw new Error("not solved");
        const payload = btoa(
          JSON.stringify({
            algorithm: c.algorithm,
            challenge: c.challenge,
            number,
            salt: c.salt,
            signature: c.signature,
          }),
        );
        onChangeRef.current(payload);
        setStatus("done");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-2.5 text-[13px] text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      {status === "solving" && (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-clay" />
          <span>Проверяем, что вы не робот…</span>
        </>
      )}
      {status === "done" && (
        <>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage text-white">
            <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
          </span>
          <span className="text-foreground">Проверка пройдена</span>
        </>
      )}
      {status === "error" && (
        <>
          <ShieldCheck className="h-4 w-4 shrink-0 text-destructive" />
          <span>Не удалось пройти проверку.</span>
          <button
            type="button"
            onClick={retry}
            className="ml-auto inline-flex items-center gap-1 font-medium text-foreground hover:text-clay"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Повторить
          </button>
        </>
      )}
      {status !== "error" && (
        <span className="ml-auto text-[11px] tracking-wide text-muted-foreground/80">ALTCHA</span>
      )}
    </div>
  );
}
