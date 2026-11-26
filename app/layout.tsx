import { headers } from "next/headers";
import { preferredLocale, type PublicLocale } from "../lib/i18n";
import type { Metadata } from "next";
import { NEW_SITE_ORIGIN } from "../lib/site-url";
import "./globals.css";

const descriptions: Record<PublicLocale,string> = {
  fr: "Actualités, radio, télévision et podcasts de BYRVOX.",
  en: "News, radio, television and podcasts from BYRVOX.",
  es: "Noticias, radio, televisión y pódcasts de BYRVOX.",
  ar: "الأخبار والإذاعة والتلفزيون والبودكاست من BYRVOX.",
  "zh-CN": "BYRVOX 的新闻、广播、电视与播客。",
  ru: "Новости, радио, телевидение и подкасты BYRVOX.",
  ko: "BYRVOX의 뉴스, 라디오, TV, 팟캐스트.",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const locale = preferredLocale(requestHeaders.get("x-byrvox-language"), undefined);
  return {
    metadataBase: new URL(NEW_SITE_ORIGIN),
    title: {
      default: "BYRVOX — Beyond the Headlines",
      template: "%s | BYRVOX",
    },
    description: descriptions[locale],
    alternates: { types: { "application/rss+xml": "/rss.xml" } },
    icons: { icon: "/favicon.svg" },
  };
}

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
