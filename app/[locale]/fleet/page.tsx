import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getPublishedBoats } from "@/db/queries";
import { formatEuros } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("fleet");
  return { title: `${t("title")} — Leal Collection` };
}

export default async function FleetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("fleet");
  const tBoat = await getTranslations("boat");
  const boats = await getPublishedBoats();

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="text-sm uppercase tracking-[0.3em] text-gold-600">
            {t("kicker")}
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl text-marine-950">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-xl text-marine-900/70">{t("subtitle")}</p>

          <div className="mt-16 grid gap-16">
            {boats.map((boat) => {
              const hero = boat.images[0];
              return (
                <article
                  key={boat.id}
                  className="grid gap-8 md:grid-cols-2 md:items-center"
                >
                  <Link
                    href={`/fleet/${boat.slug}`}
                    className="block aspect-[4/3] overflow-hidden rounded-sm"
                  >
                    {hero && (
                      <Image
                        src={hero.blobUrl}
                        alt={locale === "es" ? hero.altEs : hero.altEn}
                        width={900}
                        height={675}
                        className="h-full w-full object-cover transition duration-700 hover:scale-105"
                      />
                    )}
                  </Link>

                  <div>
                    <h2 className="font-display text-3xl text-marine-950">
                      {locale === "es" ? boat.nameEs : boat.nameEn}
                    </h2>
                    <p className="mt-3 text-marine-900/70">
                      {locale === "es" ? boat.descriptionEs : boat.descriptionEn}
                    </p>
                    <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-xs uppercase tracking-wide text-marine-900/50">
                      <span>{tBoat("length", { count: boat.lengthFt })}</span>
                      <span>{tBoat("capacity", { count: boat.capacity })}</span>
                      <span>{tBoat("cabins", { count: boat.cabins })}</span>
                      <span>{boat.homeMarina}</span>
                    </dl>
                    <p className="mt-6 font-display text-2xl text-marine-950">
                      {boat.priceFullDay > 0
                        ? tBoat("fromPrice", {
                            price: formatEuros(boat.priceAfternoon, locale),
                          })
                        : tBoat("priceOnRequest")}
                    </p>
                    <Link
                      href={`/fleet/${boat.slug}`}
                      className="mt-6 inline-block border-b border-gold-500 pb-1 text-sm uppercase tracking-widest text-marine-950 transition hover:border-marine-950"
                    >
                      {t("viewBoat")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
