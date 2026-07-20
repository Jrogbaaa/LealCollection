import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getBookingBySessionId } from "@/db/queries";

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const t = await getTranslations("reserva");

  const booking = sessionId ? await getBookingBySessionId(sessionId) : undefined;

  return (
    <>
      <SiteHeader variant="solid" />

      <main className="mx-auto max-w-xl px-6 py-24 text-center md:px-12">
        {!booking ? (
          <p className="text-marine-900/70">{t("confirmationNotFound")}</p>
        ) : booking.status === "confirmed" ? (
          <>
            <h1 className="font-display text-4xl text-marine-950">
              {t("confirmationTitle")}
            </h1>
            <p className="mt-4 text-marine-900/70">
              {t("confirmationBody", { reference: booking.reference })}
            </p>
          </>
        ) : (
          <p className="text-marine-900/70">{t("confirmationPending")}</p>
        )}

        <Link
          href="/"
          className="mt-10 inline-block rounded-full bg-marine-950 px-8 py-4 text-sm uppercase tracking-widest text-sand-50 transition hover:bg-marine-900"
        >
          {t("confirmationBackHome")}
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}
