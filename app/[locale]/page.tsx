import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getPublishedBoats, getExtras } from "@/db/queries";
import { formatEuros } from "@/lib/pricing";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const tExtras = await getTranslations("extras");
  const tBoat = await getTranslations("boat");

  const [boats, extras] = await Promise.all([getPublishedBoats(), getExtras()]);
  const boat = boats[0];
  const hero = boat?.images[0];

  return (
    <>
      <SiteHeader />

      <section className="relative flex h-[100svh] min-h-[560px] items-end overflow-hidden">
        {hero && (
          <Image
            src={hero.blobUrl}
            alt={locale === "es" ? hero.altEs : hero.altEn}
            fill
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-marine-950/90 via-marine-950/40 to-marine-950/65" />

        <div className="relative z-10 px-6 pb-20 md:px-12 md:pb-28">
          <p className="text-sm uppercase tracking-[0.3em] text-marine-200">
            {t("heroKicker")}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-white md:text-7xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/85">
            {t("heroSubtitle")}
          </p>
          <Link
            href="/reserva"
            className="mt-10 inline-block rounded-full bg-marine-950 px-8 py-4 text-sm uppercase tracking-widest text-sand-50 transition hover:bg-marine-900"
          >
            {t("heroCta")}
          </Link>
        </div>
      </section>

      <main>
        {boat && (
          <section className="mx-auto max-w-6xl px-6 py-24 md:px-12">
            <p className="text-sm uppercase tracking-[0.3em] text-marine-700 font-semibold">
              {t("fleetKicker")}
            </p>
            <div className="mt-4 grid gap-10 md:grid-cols-2 md:items-center">
              <div className="order-2 md:order-1">
                <h2 className="font-display text-4xl text-marine-950">
                  {locale === "es" ? boat.nameEs : boat.nameEn}
                </h2>
                <p className="mt-4 text-marine-900/80">
                  {locale === "es" ? boat.descriptionEs : boat.descriptionEn}
                </p>
                <dl className="mt-6 flex gap-8 text-sm text-marine-900/70">
                  <div>
                    <dt className="uppercase tracking-wide text-xs text-marine-900/50">
                      {tBoat("length", { count: boat.lengthFt })}
                    </dt>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wide text-xs text-marine-900/50">
                      {tBoat("capacity", { count: boat.capacity })}
                    </dt>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wide text-xs text-marine-900/50">
                      {tBoat("cabins", { count: boat.cabins })}
                    </dt>
                  </div>
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
                  className="mt-6 inline-block border-b border-marine-700 pb-1 text-sm uppercase tracking-widest text-marine-950 transition hover:border-marine-950"
                >
                  {t("fleetCta")}
                </Link>
              </div>

              <div className="order-1 aspect-[4/3] overflow-hidden rounded-sm md:order-2">
                {boat.images[1] && (
                  <Image
                    src={boat.images[1].blobUrl}
                    alt={
                      locale === "es"
                        ? boat.images[1].altEs
                        : boat.images[1].altEn
                    }
                    width={800}
                    height={600}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          </section>
        )}

        <section className="bg-marine-950 px-6 py-24 text-sand-50 md:px-12">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm uppercase tracking-[0.3em] text-marine-200">
              {t("extrasKicker")}
            </p>
            <h2 className="mt-4 max-w-xl font-display text-4xl">
              {t("extrasTitle")}
            </h2>
            <p className="mt-4 max-w-xl text-sand-100/70">
              {t("extrasSubtitle")}
            </p>

            <ul className="mt-12 grid gap-px overflow-hidden rounded-sm bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {extras.map((extra) => (
                <li
                  key={extra.key}
                  className="flex flex-col justify-between gap-6 bg-marine-950 p-8"
                >
                  <span className="font-display text-xl">
                    {tExtras(extra.key as "champagne")}
                  </span>
                  <span className="text-sm uppercase tracking-widest text-marine-200 font-medium">
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
        </section>

        <section className="mx-auto max-w-3xl px-6 py-28 text-center md:px-12">
          <h2 className="font-display text-4xl text-marine-950">
            {t("ctaTitle")}
          </h2>
          <p className="mt-4 text-marine-900/70">{t("ctaSubtitle")}</p>
          <Link
            href="/reserva"
            className="mt-8 inline-block rounded-full bg-marine-950 px-8 py-4 text-sm uppercase tracking-widest text-sand-50 transition hover:bg-marine-900"
          >
            {t("ctaButton")}
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
