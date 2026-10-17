import Link from "next/link";
import Image from "next/image";

const columns = [
  {
    title: "Продукт",
    links: [
      { label: "Как начать", href: "/#how-to-start" },
      { label: "Наставник", href: "/#mentor" },
      { label: "Примеры", href: "/#examples" },
      { label: "Курс", href: "/#course" },
    ],
  },
  {
    title: "Аккаунт",
    links: [
      { label: "Войти", href: "/login" },
      { label: "Регистрация", href: "/register" },
    ],
  },
  {
    title: "Open source",
    links: [
      { label: "GitHub", href: "https://github.com/SturtapHab/OpenSaas" },
      { label: "Skills для агентов", href: "https://github.com/SturtapHab/OpenSaas/tree/main/.claude/skills" },
      { label: "Автор шаблона", href: "https://t.me/wellcome_ai" },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: "linear-gradient(180deg, #f8f6f1 0, #f0ece3 240px)", color: "#16140f", fontFamily: "Onest, Geist, sans-serif" }}>
      <div className="mx-auto px-6 pt-28 pb-10" style={{ maxWidth: 1180 }}>
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12 mb-20">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 no-underline">
              <Image src="/logo.png" alt="OpenSaaS" width={30} height={30} style={{ borderRadius: 8 }} />
              <span className="text-[16px] font-medium tracking-tight text-[#16140f]" style={{ fontFamily: "Unbounded, sans-serif" }}>OpenSaaS</span>
            </Link>
            <p className="text-[14.5px] leading-relaxed text-[#4a463e] max-w-[300px]">
              Открытый шаблон для запуска своего онлайн-бизнеса. Деплой и обучение — через AI-агента.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <div className="text-[12px] font-semibold tracking-[0.16em] uppercase text-[#857f73] mb-5">{col.title}</div>
              <ul className="flex flex-col gap-3 list-none m-0 p-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="text-[15px] text-[#16140f] no-underline opacity-80 hover:opacity-100 transition-opacity"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Крупный знак бренда */}
        <div
          aria-hidden
          className="select-none text-center leading-none"
          style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: "clamp(3rem, 12.5vw, 11rem)", letterSpacing: "-0.05em", color: "transparent", WebkitTextStroke: "1px rgba(22,20,15,0.18)" }}
        >
          OpenSaaS
        </div>

        <div className="mt-8 pt-6 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#857f73]" style={{ borderTop: "1px solid rgba(22,20,15,0.08)" }}>
          <span>© {new Date().getFullYear()} OpenSaaS · Открытый код под лицензией MIT</span>
          <span>Сделано с Claude Code</span>
        </div>
      </div>
    </footer>
  );
}
