"use client";

import { LogOut, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUiStore } from "@/store/uiStore";

export function Header() {
  const { user, logout } = useAuth();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2.5 sm:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground font-display text-xs text-background">
            {initial}
          </span>
          <span className="max-w-[220px] truncate text-sm text-muted-foreground">{user?.email}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout()} aria-label="Выйти">
          <LogOut className="h-3.5 w-3.5" />
          Выйти
        </Button>
      </div>
    </header>
  );
}
