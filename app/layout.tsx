import { Cormorant_Garamond, Inter } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Routes outside app/[locale] (e.g. /admin) never go through the next-intl proxy, so
  // getLocale() falls back to the default locale for them — that's fine, admin is
  // single-language.
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-sand-50 text-marine-950">
        {children}
      </body>
    </html>
  );
}
