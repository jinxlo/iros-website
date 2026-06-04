import Image from "next/image";
import Link from "next/link";
import { localizedPath, type Locale } from "@/lib/content";

type BrandLogoProps = {
  locale: Locale;
  size?: "sm" | "md" | "lg";
  href?: boolean;
  className?: string;
  onClick?: () => void;
};

const sizes = {
  sm: "h-12 w-40",
  md: "h-14 w-48",
  lg: "h-16 w-56",
};

export function BrandLogo({
  locale,
  size = "md",
  href = true,
  className = "",
  onClick,
}: BrandLogoProps) {
  const logo = (
    <span
      className={`relative block ${sizes[size]} overflow-hidden rounded-xl bg-[var(--brand-blue)] shadow-inner ring-1 ring-white/15 ${className}`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(10,154,211,0.26),transparent_64%)]" />
      <Image
        src="/logos/iroslogo.png"
        alt="iroselectronics"
        fill
        priority={size !== "sm"}
        sizes={size === "lg" ? "224px" : size === "md" ? "192px" : "160px"}
        className="object-contain p-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
      />
    </span>
  );

  if (!href) {
    return logo;
  }

  return (
    <Link
      href={localizedPath(locale, "home")}
      onClick={onClick}
      className="inline-flex shrink-0 transition duration-300 hover:scale-[1.02]"
    >
      {logo}
    </Link>
  );
}
