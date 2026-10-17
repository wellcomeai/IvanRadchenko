import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  tag: string;
  title: React.ReactNode;
  text?: React.ReactNode;
  align?: "center" | "left";
}

/** Заголовок секции: подпись, крупный заголовок Unbounded (акцент — в <em>) и лид. */
export function SectionHeading({ tag, title, text, align = "center" }: SectionHeadingProps) {
  const center = align === "center";
  return (
    <Reveal className={center ? "text-center mx-auto" : ""}>
      <div style={{ maxWidth: center ? 780 : 560, margin: center ? "0 auto" : undefined }}>
        <div className="lx-eyebrow mb-6">{tag}</div>
        <h2 className="lx-h2">{title}</h2>
        {text && <p className="lx-lead mt-6">{text}</p>}
      </div>
    </Reveal>
  );
}
