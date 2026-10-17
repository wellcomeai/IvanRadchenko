import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Фон как на лендинге: тонкая сетка и тёплое свечение сверху */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(22,20,15,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(22,20,15,.05)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_30%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-240px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(194,97,59,.14),transparent)]"
      />

      <header className="relative px-5 py-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-lg" />
          <span className="font-display text-[15px] text-foreground">OpenSaaS</span>
        </Link>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
