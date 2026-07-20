import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import BookingFlow from "@/components/booking-flow";
import { getPublishedBoats, getExtras, getBlockedDatesForBoat } from "@/db/queries";
import type { Slot } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reserva");
  return { title: `${t("title")} — Leal Collection` };
}

export default async function ReservaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ boat?: string }>;
}) {
  const { locale } = await params;
  const { boat: boatSlug } = await searchParams;
  const t = await getTranslations("reserva");

  const boats = await getPublishedBoats();
  if (boats.length === 0) notFound();
  const boat = (boatSlug && boats.find((b) => b.slug === boatSlug)) || boats[0];

  const [extras, blocked] = await Promise.all([
    getExtras(),
    getBlockedDatesForBoat(boat.id),
  ]);

  const blockedFullDates = blocked.filter((d) => !d.slot).map((d) => d.date);
  const blockedSlotsByDate: Record<string, Slot[]> = {};
  for (const d of blocked) {
    if (d.slot) {
      blockedSlotsByDate[d.date] = [...(blockedSlotsByDate[d.date] ?? []), d.slot];
    }
  }

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="mx-auto max-w-5xl px-6 py-16 md:px-12">
        <p className="text-sm uppercase tracking-[0.3em] text-gold-600">{t("kicker")}</p>
        <h1 className="mt-4 font-display text-4xl text-marine-950 md:text-5xl">
          {t("title")}
        </h1>

        <Suspense>
          <BookingFlow
            locale={locale}
            boat={boat}
            extras={extras}
            blockedFullDates={blockedFullDates}
            blockedSlotsByDate={blockedSlotsByDate}
          />
        </Suspense>
      </main>

      <SiteFooter />
    </>
  );
}
