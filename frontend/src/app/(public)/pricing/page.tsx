import { redirect } from "next/navigation";

/** Цена курса показана на главной в блоке «Стоимость». */
export default function PricingPage() {
  redirect("/#price");
}
