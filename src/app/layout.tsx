import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import { getSiteUrl } from "@/lib/site";

const adsClient = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT;
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

const siteUrl = getSiteUrl();
const defaultDescription =
  "파이어플레이스(FirePlace) — 수원·안양·강남 등 전국 지역별 술집, 룸술집, 바를 테마·지도로 찾아보세요.";

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "FirePlace",
  alternateName: ["파이어플레이스", "파이어 플레이스", "Fire Place"],
  url: siteUrl,
  description: defaultDescription,
  inLanguage: "ko-KR",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FirePlace(파이어플레이스) · 지역별 술집·룸술집 찾기",
    template: "%s | FirePlace",
  },
  description: defaultDescription,
  keywords: [
    "파이어플레이스",
    "FirePlace",
    "술집",
    "룸술집",
    "지역별 술집",
    "수원 술집",
    "안양 술집",
    "강남 술집",
    "바 찾기",
  ],
  robots: { index: true, follow: true },
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {adsClient ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <Script id="consent-gtag-stub" strategy="beforeInteractive">
          {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

