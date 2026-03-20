"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "fp_cookie_consent";

type ConsentValue = "accepted" | "rejected";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v !== "accepted" && v !== "rejected") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const save = useCallback((value: ConsentValue) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    const g = window.gtag as ((...args: unknown[]) => void) | undefined;
    if (g) {
      if (value === "rejected") {
        g("consent", "update", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
          analytics_storage: "denied",
        });
      } else {
        g("consent", "update", {
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
          analytics_storage: "granted",
        });
      }
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="쿠키 및 광고 안내"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-card/95 p-4 shadow-lg backdrop-blur-md md:left-auto md:right-4 md:bottom-4 md:max-w-md md:rounded-lg md:border"
    >
      <p className="text-sm leading-relaxed text-foreground">
        서비스 제공과 <strong className="font-medium">맞춤 광고</strong>(Google 애드센스 등)를 위해 쿠키 및
        유사 기술이 사용될 수 있습니다. 자세한 내용은{" "}
        <Link href="/privacy" className="text-primary underline underline-offset-2">
          개인정보처리방침
        </Link>
        을 확인해 주세요.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => save("accepted")}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          동의
        </button>
        <button
          type="button"
          onClick={() => save("rejected")}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          거부
        </button>
      </div>
    </div>
  );
}
