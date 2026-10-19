import { redirect } from "next/navigation";

/** Тарифов пока нет: обучение бесплатное. Вернуть страницу, когда подключим Робокассу. */
export default function PricingPage() {
  redirect("/#program");
}
