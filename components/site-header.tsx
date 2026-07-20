import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * "transparent" (default) sits over a full-bleed dark hero directly beneath it
 * (homepage, boat detail) — do not use on pages without one, the white text
 * becomes illegible. "solid" is a normal in-flow light header for pages with
 * no hero (fleet listing, booking flow, admin, etc).
 */
export default function SiteHeader({
  variant = "transparent",
}: {
  variant?: "transparent" | "solid";
}) {
  const t = useTranslations("nav");
  const isSolid = variant === "solid";

  return (
    <header
      className={
        isSolid
          ? "relative z-40 flex items-center justify-between border-b border-marine-950/10 bg-sand-50 px-6 py-6 md:px-12"
          : "absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-6 md:px-12"
      }
    >
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/images/brand/logo.webp"
          alt="Leal Collection"
          width={44}
          height={44}
          className="h-11 w-11"
          priority
          unoptimized
        />
        <span
          className={`font-display text-lg tracking-wide ${isSolid ? "text-marine-950" : "text-white"}`}
        >
          Leal Collection
        </span>
      </Link>

      <nav
        className={`hidden items-center gap-8 text-sm tracking-wide md:flex ${isSolid ? "text-marine-900/90" : "text-white/90"}`}
      >
        <Link
          href="/fleet"
          className={isSolid ? "transition hover:text-gold-600" : "transition hover:text-gold-300"}
        >
          {t("fleet")}
        </Link>
        <Link
          href="/experiencias"
          className={isSolid ? "transition hover:text-gold-600" : "transition hover:text-gold-300"}
        >
          {t("experiences")}
        </Link>
        <Link
          href="/contacto"
          className={isSolid ? "transition hover:text-gold-600" : "transition hover:text-gold-300"}
        >
          {t("contact")}
        </Link>
        <Link
          href="/reserva"
          className={
            isSolid
              ? "rounded-full border border-gold-500/60 px-5 py-2 text-gold-600 transition hover:border-gold-500 hover:bg-gold-100/60"
              : "rounded-full border border-gold-300/60 px-5 py-2 text-gold-100 transition hover:border-gold-300 hover:bg-gold-300/10"
          }
        >
          {t("reserve")}
        </Link>
      </nav>
    </header>
  );
}
