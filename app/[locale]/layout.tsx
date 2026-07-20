import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import WhatsAppBubble from "@/components/whatsapp-bubble";

export const metadata: Metadata = {
  title: "Leal Collection — Fine Yachting, Ibiza",
  description:
    "Private yacht charters in Ibiza. Reserve your day on the water with skipper, champagne and curated extras.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <NextIntlClientProvider>
      {children}
      <WhatsAppBubble locale={locale} />
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
