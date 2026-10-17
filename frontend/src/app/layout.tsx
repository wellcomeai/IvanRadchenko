import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "OpenSaaS — свой онлайн-бизнес за 15 минут с Claude Code или Codex",
  description:
    "Открытый SaaS-шаблон (MIT) на FastAPI + Next.js. Отдайте AI-агенту ключ Timeweb — он сам задеплоит сервис с регистрацией, оплатой через Робокассу, кабинетом и админкой.",
  icons: {
    icon: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
