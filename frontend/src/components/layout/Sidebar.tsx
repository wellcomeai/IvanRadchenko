"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenCheck,
  ChevronDown,
  FileText,
  LayoutDashboard,
  PlayCircle,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { courseApi } from "@/api/course";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import type { CourseModule } from "@/types";

const adminNav = [
  { href: "/admin/course", label: "Управление курсом", icon: BookOpenCheck },
  { href: "/admin/users", label: "Ученики", icon: Users },
  { href: "/admin", label: "Сводка", icon: ShieldCheck, exact: true },
];

const linkBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200";
const linkIdle = "text-white/65 hover:bg-white/[0.06] hover:text-white";
const linkActive = "bg-white/[0.1] text-white";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link href={href} onClick={onNavigate} className={cn(linkBase, active ? linkActive : linkIdle)}>
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-gold")} strokeWidth={active ? 2 : 1.75} />
      {label}
    </Link>
  );
}

function ModuleItem({
  module,
  pathname,
  onNavigate,
}: {
  module: CourseModule;
  pathname: string;
  onNavigate?: () => void;
}) {
  const containsCurrent =
    pathname === `/modules/${module.id}` ||
    module.lessons.some((l) => pathname === `/lessons/${l.id}`);
  const [open, setOpen] = useState(containsCurrent);

  // Переход на урок из другого места (кнопки «дальше») раскрывает его модуль.
  useEffect(() => {
    if (containsCurrent) setOpen(true);
  }, [containsCurrent]);

  return (
    <div>
      <div
        className={cn(
          "group flex items-center rounded-xl transition-colors",
          pathname === `/modules/${module.id}` ? linkActive : "hover:bg-white/[0.06]",
        )}
      >
        <Link
          href={`/modules/${module.id}`}
          onClick={() => {
            setOpen(true);
            onNavigate?.();
          }}
          className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3 text-sm no-underline"
        >
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
              containsCurrent
                ? "border-gold bg-gold text-[#0f1e3d]"
                : "border-gold/50 text-gold",
            )}
          >
            {module.position}
          </span>
          <span
            className={cn(
              "truncate font-medium",
              containsCurrent ? "text-white" : "text-white/75 group-hover:text-white",
            )}
            title={module.title}
          >
            {module.title}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Свернуть модуль" : "Показать уроки"}
          aria-expanded={open}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/50 hover:text-white"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="mb-1 ml-[23px] mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
          {module.lessons.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-white/40">Уроки скоро появятся</div>
          )}
          {module.lessons.map((lesson, i) => {
            const active = pathname === `/lessons/${lesson.id}`;
            const Icon = lesson.has_video ? PlayCircle : FileText;
            return (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                onClick={onNavigate}
                className={cn(
                  "flex items-start gap-2 rounded-lg px-2 py-1.5 text-[13px] leading-snug no-underline transition-colors",
                  active ? "bg-white/[0.1] text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white",
                  !lesson.is_published && "opacity-60",
                )}
              >
                <Icon className={cn("mt-px h-3.5 w-3.5 shrink-0", active && "text-gold")} />
                <span className="min-w-0">
                  {i + 1}. {lesson.title}
                  {!lesson.is_published && (
                    <span className="ml-1.5 rounded bg-white/10 px-1 py-px text-[10px] uppercase tracking-wide">
                      черновик
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const user = useAuthStore((s) => s.user);
  const { data: modules } = useQuery({
    queryKey: ["course-modules"],
    queryFn: () => courseApi.modules(),
    enabled: Boolean(user),
  });

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      <NavLink
        href="/dashboard"
        label="Главная"
        icon={LayoutDashboard}
        active={pathname === "/dashboard"}
        onNavigate={onNavigate}
      />

      <div className="px-3 pb-1.5 pt-5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold/80">
        Программа курса
      </div>
      {!modules &&
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mx-3 my-2 h-5 animate-pulse rounded-md bg-white/[0.06]" />
        ))}
      {modules?.map((m) => (
        <ModuleItem key={m.id} module={m} pathname={pathname} onNavigate={onNavigate} />
      ))}

      <div className="my-3 border-t border-white/10" />
      <NavLink
        href="/settings"
        label="Настройки"
        icon={Settings}
        active={pathname.startsWith("/settings")}
        onNavigate={onNavigate}
      />

      {user?.role === "admin" && (
        <>
          <div className="px-3 pb-1.5 pt-5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold/80">
            Администрирование
          </div>
          {adminNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </>
      )}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-5 no-underline"
      >
        <Image src="/logo.png" alt="" width={40} height={40} />
        <span className="font-display text-[15px] leading-tight text-white">
          Школа
          <br />
          <span className="text-gold">Независимости</span>
        </span>
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,.15)_transparent]">
        <NavLinks onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 bg-[#0f1e3d] bg-[linear-gradient(180deg,#132650_0%,#0f1e3d_45%,#0b1730_100%)] md:block">
        <SidebarContent />
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-[#0f1e3d] bg-[linear-gradient(180deg,#132650_0%,#0f1e3d_45%,#0b1730_100%)] shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent onNavigate={() => setSidebarOpen(false)} />
      </aside>
    </>
  );
}
