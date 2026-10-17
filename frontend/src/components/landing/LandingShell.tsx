"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Обёртка лендинга: токены темы (.lx) и уважение к prefers-reduced-motion. */
export function LandingShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className={"lx min-h-screen overflow-x-clip " + className}>{children}</div>
    </MotionConfig>
  );
}
