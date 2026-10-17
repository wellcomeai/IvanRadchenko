import { BRAND_ICONS, type BrandKey } from "./brand-icons-data";

interface BrandIconProps {
  name: BrandKey;
  size?: number;
  /** Цвет иконки. По умолчанию — фирменный цвет бренда. */
  color?: string;
  className?: string;
}

export function BrandIcon({ name, size = 20, color, className }: BrandIconProps) {
  const icon = BRAND_ICONS[name];
  return (
    <svg
      role="img"
      aria-label={icon.title}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={color ?? icon.hex}
      style={{ flex: "none" }}
    >
      <title>{icon.title}</title>
      <path d={icon.path} fillRule={icon.evenodd ? "evenodd" : undefined} />
    </svg>
  );
}
