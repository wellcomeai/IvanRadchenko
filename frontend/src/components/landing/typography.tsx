import { Fragment } from "react";

/**
 * Не даёт браузеру разорвать составное слово на дефисе («Онлайн-школа», «AI-сервис»):
 * такие слова оборачиваются в nowrap. Для заголовков из данных, где нельзя
 * расставить разметку руками.
 */
export function keepHyphenated(text: string) {
  return text.split(/(\S+-\S+)/).map((part, i) =>
    part.includes("-") ? (
      <span key={i} className="whitespace-nowrap">{part}</span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
