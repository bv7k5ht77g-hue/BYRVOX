import { headers } from "next/headers";
import { preferredLocale } from "../lib/i18n";
import type { Metadata } from "next";
import { SITE_ORIGIN } from "../lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "BYRVOX — Beyond the Headlines",
    template: "%s | BYRVOX",
  },
  description: "Actualités, radio, télévision et podcasts de BYRVOX.",
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
  icons: { icon: "/favicon.svg" },
};

const initialTheme = `(function () {
  var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  try {
    var stored = localStorage.getItem('byrvox-theme');
    if (stored === 'dark' || stored === 'light') dark = stored === 'dark';
  } catch {}
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();`;

export default async function Layout({ children }: { children: React.ReactNode }) {
  const locale = preferredLocale((await headers()).get("x-byrvox-language"),undefined);
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: initialTheme }} /></head>
      <body>{children}</body>
    </html>
  );
}
