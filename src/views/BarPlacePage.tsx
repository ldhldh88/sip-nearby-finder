"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BarDetailSheet from "@/components/BarDetailSheet";
import Footer from "@/components/Footer";
import type { KakaoPlace } from "@/lib/kakao";

type BarPlacePageProps = {
  place: KakaoPlace;
  districtName: string;
  provinceName: string;
};

const BarPlacePage = ({ place, districtName, provinceName }: BarPlacePageProps) => {
  const [sheetOpen, setSheetOpen] = useState(true);
  const address = place.road_address_name || place.address_name || "";

  const mapsHref = useMemo(() => {
    const lat = place.y;
    const lng = place.x;
    if (!lat || !lng) return null;
    return `https://map.kakao.com/link/map/${encodeURIComponent(place.place_name)},${lat},${lng}`;
  }, [place]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 h-14 border-b border-border backdrop-blur-md bg-background/80">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-semibold text-foreground transition-colors hover:text-primary">
            ← 홈
          </Link>
          <span className="max-w-[60%] truncate text-xs text-muted-foreground">가게 정보</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-24">
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm" itemScope itemType="https://schema.org/BarOrPub">
          <h1 className="text-2xl font-bold tracking-tight text-foreground" itemProp="name">
            {place.place_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {provinceName} · {districtName}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-foreground" itemProp="description">
            {place.category_name} · {address}
            {place.phone ? ` · 전화 ${place.phone}` : ""}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                카카오맵에서 보기
              </a>
            ) : null}
            <Link href="/" className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium">
              다른 술집 찾기
            </Link>
          </div>
        </article>
      </main>

      <Footer />

      <BarDetailSheet
        place={sheetOpen ? place : null}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
};

export default BarPlacePage;
