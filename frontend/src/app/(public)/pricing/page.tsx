import { redirect } from "next/navigation";

/** Отдельной страницы тарифов нет: стоимость указана в оферте и на странице оплаты. */
export default function PricingPage() {
  redirect("/#program");
}
