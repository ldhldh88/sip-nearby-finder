"use client";

import { useState } from "react";
import HomeAppHeader from "@/components/HomeAppHeader";
import HomeRecommendHero from "@/components/HomeRecommendHero";
import BarDetailSheet from "@/components/BarDetailSheet";
import Footer from "@/components/Footer";
import { KakaoPlace } from "@/lib/kakao";

const Index = () => {
  const [detailPlace, setDetailPlace] = useState<KakaoPlace | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <HomeAppHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col bg-background px-4 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
        <HomeRecommendHero onSelectPlace={(place) => setDetailPlace(place)} />
      </main>

      <div className="relative z-10 bg-background">
        <Footer />
      </div>

      <BarDetailSheet place={detailPlace} onClose={() => setDetailPlace(null)} />
    </div>
  );
};

export default Index;
