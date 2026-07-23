import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import BoatGallery from "@/components/boat-gallery";
import { getBoatBySlug, getExtras } from "@/db/queries";
import { formatEuros } from "@/lib/pricing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const boat = await getBoatBySlug(slug);
  if (!boat) return {};
  return { title: `${locale === "es" ? boat.nameEs : boat.nameEn} — Leal Collection` };
}

export default async function BoatPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("fleet");
  const tBoat = await getTranslations("boat");
  const tExtras = await getTranslations("extras");

  const [boat, extras] = await Promise.all([getBoatBySlug(slug), getExtras()]);
  if (!boat || !boat.isPublished) {
    notFound();
  }

  const [hero, ...gallery] = boat.images;
  const name = locale === "es" ? boat.nameEs : boat.nameEn;

  return (
    <>
      <SiteHeader />

      <section className="relative flex h-[70svh] min-h-[420px] items-end overflow-hidden">
        {hero && (
          <Image
            src={hero.blobUrl}
            alt={locale === "es" ? hero.altEs : hero.altEn}
            fill
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-marine-950/85 via-marine-950/10 to-marine-950/40" />
        <div className="relative z-10 px-6 pb-14 md:px-12">
          <h1 className="font-display text-5xl text-white md:text-6xl">{name}</h1>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-16 md:px-12">
        <Link
          href="/fleet"
          className="text-sm uppercase tracking-widest text-marine-900/60 transition hover:text-marine-950"
        >
          ← {t("backToFleet")}
        </Link>

        <div className="mt-8 grid gap-12 md:grid-cols-[2fr_1fr]">
          <div>
            <p className="text-marine-900/80">
              {locale === "es" ? boat.descriptionEs : boat.descriptionEn}
            </p>

            <p className="mt-10 text-sm uppercase tracking-[0.3em] text-marine-700 font-semibold">
              {t("specsKicker")}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-marine-900/50">
                  {tBoat("length", { count: boat.lengthFt })}
                </dt>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-marine-900/50">
                  {tBoat("capacity", { count: boat.capacity })}
                </dt>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-marine-900/50">
                  {tBoat("cabins", { count: boat.cabins })}
                </dt>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-marine-900/50">
                  {t("homeMarina")}: {boat.homeMarina}
                </dt>
              </div>
            </dl>

            <BoatGallery images={boat.images} locale={locale} />

            <p className="mt-16 text-sm uppercase tracking-[0.3em] text-marine-700 font-semibold">
              {t("onBoardKicker")}
            </p>
            <ul className="mt-4 grid gap-px overflow-hidden rounded-sm bg-marine-950/10 sm:grid-cols-2">
              {extras.map((extra) => (
                <li
                  key={extra.key}
                  className="flex items-center justify-between gap-6 bg-sand-50 p-5"
                >
                  <span className="text-marine-950">
                    {tExtras(extra.key as "champagne")}
                  </span>
                  <span className="text-sm uppercase tracking-widest text-marine-700 font-medium">
                    {extra.isIncluded
                      ? tExtras("included")
                      : extra.price > 0
                        ? formatEuros(extra.price, locale)
                        : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="h-fit rounded-sm border border-marine-950/10 p-8">
            {boat.priceFullDay > 0 ? (
              <dl className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <dt className="text-sm text-marine-900/60">{t("fullDay")}</dt>
                  <dd className="font-display text-xl text-marine-950">
                    {formatEuros(boat.priceFullDay, locale)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-sm text-marine-900/60">{t("halfDay")}</dt>
                  <dd className="font-display text-xl text-marine-950">
                    {formatEuros(boat.priceMorning, locale)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="font-display text-xl text-marine-950">
                {tBoat("priceOnRequest")}
              </p>
            )}
            <Link
              href={`/reserva?boat=${boat.slug}`}
              className="mt-8 block rounded-full bg-marine-950 px-8 py-4 text-center text-sm uppercase tracking-widest text-sand-50 transition hover:bg-marine-900"
            >
              {t("reserveCta")}
            </Link>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
