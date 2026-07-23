import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("experiences");
  return { title: `${t("title")} — Leal Collection` };
}

export default async function ExperiencesPage() {
  const t = await getTranslations("experiences");

  const chapters = [
    { title: t("sunsetTitle"), body: t("sunsetBody") },
    { title: t("islandTitle"), body: t("islandBody") },
    { title: t("privateTitle"), body: t("privateBody") },
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
          <div className="divide-y divide-marine-950/10 border-y border-marine-950/10">
            {chapters.map((c) => (
              <article
                key={c.title}
                className="grid gap-2 py-10 md:grid-cols-[1fr_2fr] md:gap-10"
              >
                <h2 className="font-display text-2xl text-marine-950 md:text-3xl">
                  {c.title}
                </h2>
                <p className="text-marine-900/75">{c.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-28 text-center md:px-12">
          <h2 className="font-display text-4xl text-marine-950">{t("ctaTitle")}</h2>
          <p className="mt-4 text-marine-900/70">{t("ctaBody")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/reserva"
              className="inline-block rounded-full bg-marine-950 px-8 py-4 text-sm uppercase tracking-widest text-sand-50 transition hover:bg-marine-900"
            >
              {t("ctaButton")}
            </Link>
            <Link
              href="/contacto"
              className="inline-block rounded-full border border-marine-950/25 px-8 py-4 text-sm uppercase tracking-widest text-marine-950 transition hover:border-marine-950"
            >
              {t("contactButton")}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
