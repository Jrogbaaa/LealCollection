import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { whatsappHref } from "@/lib/contact";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return { title: `${t("title")} — Leal Collection` };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("contact");

  const details = [
    { label: t("marinaLabel"), value: t("marinaValue") },
    { label: t("seasonLabel"), value: t("seasonValue") },
  ];

  return (
    <>
      <SiteHeader variant="solid" />

      <main>
        <section className="bg-marine-950 px-6 py-28 text-sand-50 md:px-12">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm uppercase tracking-[0.3em] text-marine-200">
              {t("kicker")}
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-5xl leading-[1.05] md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-sand-100/75">{t("intro")}</p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-24 md:px-12">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-marine-700 font-semibold">
                {t("whatsappLabel")}
              </p>
              <p className="mt-3 text-marine-900/75">{t("whatsappValue")}</p>
              <a
                href={whatsappHref(locale)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-full bg-marine-950 px-8 py-4 text-sm uppercase tracking-widest text-sand-50 transition hover:bg-marine-900"
              >
                {t("whatsappButton")}
              </a>
            </div>

            <dl className="space-y-6">
              {details.map((d) => (
                <div key={d.label} className="border-b border-marine-950/10 pb-6">
                  <dt className="text-xs uppercase tracking-[0.3em] text-marine-900/50">
                    {d.label}
                  </dt>
                  <dd className="mt-2 font-display text-xl text-marine-950">{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-16 border-t border-marine-950/10 pt-12">
            <p className="max-w-xl text-marine-900/75">{t("reserveNote")}</p>
            <Link
              href="/reserva"
              className="mt-6 inline-block border-b border-marine-700 pb-1 text-sm uppercase tracking-widest text-marine-950 transition hover:border-marine-950"
            >
              {t("reserveButton")}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
