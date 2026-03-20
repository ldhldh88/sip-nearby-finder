import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import { getSiteUrl } from "@/lib/site";

const adsClient = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "FirePlace · 지역별 술집 찾기",
  description: "FirePlace에서 지역별 인기 술집을 한눈에 찾아보세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Script id="consent-gtag-stub" strategy="beforeInteractive">
          {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
`}
        </Script>
        {adsClient ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

