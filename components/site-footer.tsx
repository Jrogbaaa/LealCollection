import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function SiteFooter() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  return (
    <footer className="mt-auto border-t border-marine-900/10 bg-marine-950 px-6 py-14 text-sand-50 md:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-2xl tracking-wide">Leal Collection</p>
          <p className="mt-1 text-sm text-sand-100/60">{t("tagline")}</p>
        </div>

        <nav className="flex gap-8 text-sm text-sand-100/80">
          <Link href="/fleet" className="hover:text-gold-300">
            {nav("fleet")}
          </Link>
          <Link href="/experiencias" className="hover:text-gold-300">
            {nav("experiences")}
          </Link>
          <Link href="/reserva" className="hover:text-gold-300">
            {nav("reserve")}
          </Link>
          <Link href="/contacto" className="hover:text-gold-300">
            {nav("contact")}
          </Link>
        </nav>
      </div>

      <p className="mx-auto mt-10 max-w-6xl text-xs text-sand-100/40">
        © {new Date().getFullYear()} Leal Collection. {t("rights")}
      </p>
    </footer>
  );
}
