import Link from "next/link";
import Image from "next/image";

const columns = [
  {
    title: "Обучение",
    links: [
      { label: "Программа курса", href: "/#program" },
      { label: "Как проходит обучение", href: "/#how" },
      { label: "Для кого", href: "/#for-whom" },
    ],
  },
  {
    title: "Аккаунт",
    links: [
      { label: "Войти", href: "/login" },
      { label: "Регистрация", href: "/register" },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: "linear-gradient(180deg, #f5f6f8 0, #eceff4 240px)", color: "#0f1e3d", fontFamily: "Onest, Geist, sans-serif" }}>
      <div className="mx-auto px-6 pt-24 pb-10" style={{ maxWidth: 1180 }}>
        <div className="grid md:grid-cols-[1.6fr_1fr_1fr] gap-12 mb-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-5 no-underline">
              <Image src="/logo.png" alt="" width={44} height={44} />
              <span className="text-[18px] font-semibold leading-tight text-[#0f1e3d]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Школа <span className="text-[#a8861c]">Независимости</span>
              </span>
            </Link>
            <p className="text-[14.5px] leading-relaxed text-[#3b4a66] max-w-[320px]">
              Онлайн-школа финансовой грамотности: от личного бюджета до собственной стратегии финансовой независимости.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <div className="text-[12px] font-semibold tracking-[0.16em] uppercase text-[#6b7894] mb-5">{col.title}</div>
              <ul className="flex flex-col gap-3 list-none m-0 p-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[15px] text-[#0f1e3d] no-underline opacity-80 hover:opacity-100 transition-opacity">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#6b7894]" style={{ borderTop: "1px solid rgba(15,30,61,0.08)" }}>
          <span>© {new Date().getFullYear()} Школа Независимости</span>
          <span>Материалы курса носят образовательный характер и не являются индивидуальной инвестиционной рекомендацией.</span>
        </div>
      </div>
    </footer>
  );
}
