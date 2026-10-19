# Components — контекст

## Структура

- `ui/` — базовые shadcn компоненты (Button, Input, Card, Badge, Dialog,
  Label, Skeleton, Textarea). Стилизуются через CSS-переменные темы.
- `layout/` — Sidebar, Header, Footer, PublicHeader.
- `landing/` — секции лендинга (Hero, Features, Pricing, Testimonials,
  FAQ, CTA).
- `billing/` — TrialBanner, PlanCard, PaymentHistory.
- `referrals/` — ReferralWidget, PayoutHistory.
- `AuthGuard.tsx` — обёртка для защищённых страниц (требует логин,
  опционально требует admin).
- `EmailBanner.tsx` — баннер «подтвердите email» (показывается, только
  если на сервере настроена почта и `user.is_email_verified === false`).
- `auth/` — `AuthCard` (карточка страниц входа), `AltchaCheck` (невидимая
  проверка «не робот», решает задачу ALTCHA в браузере), `VerifyCodeForm`
  (ввод 6-значного кода из письма).
- `Providers.tsx` — `QueryClientProvider` + `Toaster`.

## Соглашения

- Все компоненты, использующие хуки или интерактивность, помечены
  `"use client"` сверху.
- Серверные компоненты (без `"use client"`) предпочтительнее для статики
  — это уменьшает JS-бандл.
- Стили через Tailwind utility-классы и `cn(...)` из `@/lib/utils`.
- Иконки — `lucide-react`.

## Добавление shadcn-компонента

Скопируйте файл из <https://ui.shadcn.com> в `components/ui/`. Большинство
компонентов уже использует Radix UI (`@radix-ui/...`) — добавьте нужный
пакет в `package.json`.

## Тема / бренд

«Школа Независимости». Цвета приходят из `globals.css` через CSS-переменные:
светлый бело-серый фон (`--background`), глубокий тёмно-синий текст и кнопки
(`--primary`, `#0f1e3d`), акцент — синий чуть светлее (`--clay`, исторически так
называется; классы `text-clay`, `bg-clay-soft`), золото логотипа (`--gold`, классы
`text-gold`, `bg-gold-soft`) — только для точечных выделений, зелёный `--sage` для
успеха. Сайдбар кабинета тёмно-синий. Заголовки — `font-display` (Playfair Display),
текст — Onest. Логотипы: `public/logo.png` (знак), `public/logo-full.webp` (с надписью).

- `course/` — `form.tsx` (Switch, выбор модуля), `plural.ts` (склонение «урок/урока/уроков»).
- `landing/SchoolLanding.tsx` — главная страница школы.
