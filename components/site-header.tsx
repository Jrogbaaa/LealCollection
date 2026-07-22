"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * "transparent" (default) sits over a full-bleed dark hero directly beneath it
 * (homepage, boat detail) — do not use on pages without one, the white text
 * becomes illegible. "solid" is a normal in-flow light header for pages with
 * no hero (fleet listing, booking flow, admin, etc).
 *
 * The logo asset itself is navy + gold — on "transparent" it's filtered to a
 * white silhouette (brightness(0) invert(1)) so it stays visible over dark
 * hero photography; "solid" keeps the asset's real color since it sits on
 * light bg-sand-50.
 */
export default function SiteHeader({
  variant = "transparent",
}: {
  variant?: "transparent" | "solid";
}) {
  const t = useTranslations("nav");
  const isSolid = variant === "solid";
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const navLinkClass = isSolid
    ? "transition hover:text-gold-600"
    : "transition hover:text-gold-300";
  const reserveLinkClass = isSolid
    ? "rounded-full border border-gold-500/60 px-5 py-2 text-gold-600 transition hover:border-gold-500 hover:bg-gold-100/60"
    : "rounded-full border border-gold-300/60 px-5 py-2 text-gold-100 transition hover:border-gold-300 hover:bg-gold-300/10";

  return (
    <header
      ref={headerRef}
      className={
        isSolid
          ? "relative z-40 flex items-center justify-between border-b border-marine-950/10 bg-sand-50 px-6 py-6 md:px-12"
          : "absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-6 md:px-12"
      }
    >
      <Link href="/" aria-label="Leal Collection — home" className="flex items-center">
        <Image
          src="/images/brand/logo.webp"
          alt="Leal Collection"
          width={288}
          height={362}
          className="h-16 w-auto md:h-20"
          style={!isSolid ? { filter: "brightness(0) invert(1)" } : undefined}
          priority
          unoptimized
        />
      </Link>

      <nav
        className={`hidden items-center gap-8 text-sm tracking-wide md:flex ${isSolid ? "text-marine-900/90" : "text-white/90"}`}
      >
        <Link href="/fleet" className={navLinkClass}>
          {t("fleet")}
        </Link>
        <Link href="/experiencias" className={navLinkClass}>
          {t("experiences")}
        </Link>
        <Link href="/contacto" className={navLinkClass}>
          {t("contact")}
        </Link>
        <Link href="/reserva" className={reserveLinkClass}>
          {t("reserve")}
        </Link>
      </nav>

      <button
        type="button"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((open) => !open)}
        className={`flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 md:hidden ${
          isSolid ? "text-marine-950" : "text-white"
        }`}
      >
        <span
          className={`block h-px w-6 bg-current transition-transform ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
        />
        <span
          className={`block h-px w-6 bg-current transition-transform ${menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}
        />
      </button>

      {menuOpen && (
        <nav
          className={`absolute inset-x-0 top-full flex flex-col border-b px-6 py-2 text-sm tracking-wide md:hidden ${
            isSolid
              ? "border-marine-950/10 bg-sand-50 text-marine-900/90"
              : "border-white/10 bg-marine-950 text-white/90"
          }`}
        >
          <Link href="/fleet" className="py-4" onClick={() => setMenuOpen(false)}>
            {t("fleet")}
          </Link>
          <Link href="/experiencias" className="py-4" onClick={() => setMenuOpen(false)}>
            {t("experiences")}
          </Link>
          <Link href="/contacto" className="py-4" onClick={() => setMenuOpen(false)}>
            {t("contact")}
          </Link>
          <Link href="/reserva" className="py-4" onClick={() => setMenuOpen(false)}>
            {t("reserve")}
          </Link>
        </nav>
      )}
    </header>
  );
}
