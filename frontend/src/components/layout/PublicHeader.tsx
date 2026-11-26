"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useHasSession } from "@/hooks/useHasSession";

const navLinks = [
  { href: "/#program", label: "Программа" },
  { href: "/#how", label: "Как проходит обучение" },
  { href: "/#for-whom", label: "Для кого" },
];

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Вошедшему человеку вместо «Войти / Регистрация» показываем вход в кабинет.
  const loggedIn = useHasSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-4 pt-3" style={{ fontFamily: "Onest, Geist, sans-serif" }}>
      <div
        className="mx-auto flex items-center justify-between h-[60px] pl-5 pr-2 rounded-full transition-all duration-500"
        style={{
          maxWidth: 1180,
          background: scrolled || open ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.4)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          border: "1px solid rgba(15,30,61,0.08)",
          boxShadow: scrolled ? "0 1px 2px rgba(15,30,61,0.04), 0 16px 40px -16px rgba(15,30,61,0.18)" : "none",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="Школа Независимости" width={36} height={36} priority />
          <span className="hidden text-[16px] font-semibold leading-none text-[#0f1e3d] min-[440px]:inline" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Школа <span className="text-[#a8861c]">Независимости</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="text-[14px] text-[#3b4a66] no-underline transition-colors hover:text-[#0f1e3d]" style={{ letterSpacing: "-0.005em" }}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {loggedIn ? (
            <Link href="/dashboard" className="inline-flex items-center h-10 px-5 rounded-full text-[14px] font-semibold text-white no-underline transition-transform hover:-translate-y-px" style={{ background: "#0f1e3d" }}>
              Личный кабинет
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex items-center h-10 px-4 rounded-full text-[14px] font-medium text-[#3b4a66] no-underline hover:text-[#0f1e3d] hover:bg-black/[0.05] transition-colors">
                Войти
              </Link>
              <Link href="/register" className="inline-flex items-center h-10 px-5 rounded-full text-[14px] font-semibold text-white no-underline transition-transform hover:-translate-y-px" style={{ background: "#0f1e3d" }}>
                Регистрация
              </Link>
            </>
          )}
          <button
            type="button"
            className="md:hidden inline-flex w-10 h-10 items-center justify-center rounded-full hover:bg-black/[0.05]"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="md:hidden mx-auto mt-2 rounded-3xl p-3 flex flex-col"
          style={{ maxWidth: 1180, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(15,30,61,0.08)", boxShadow: "0 16px 40px -16px rgba(15,30,61,0.18)" }}
        >
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="px-4 py-3 rounded-2xl text-[16px] text-[#0f1e3d] no-underline hover:bg-black/[0.04]">
              {label}
            </Link>
          ))}
          <Link href={loggedIn ? "/dashboard" : "/login"} onClick={() => setOpen(false)} className="px-4 py-3 rounded-2xl text-[16px] text-[#3b4a66] no-underline hover:bg-black/[0.04]">
            {loggedIn ? "Личный кабинет" : "Войти"}
          </Link>
        </nav>
      )}
    </header>
  );
}
