import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const defaultTitle = "FirePlace · 근처 한 잔 추천 · 파이어플레이스";
const defaultDescription =
  "내 위치 기준으로 근처 술집을 추천받아 보세요. FirePlace(파이어플레이스)에서 좋아요가 많은 술집을 빠르게 골라 드립니다. 지역별 탐색은 둘러보기에서 이용할 수 있습니다.";

const baseKeywords = [
  "파이어플레이스",
  "FirePlace",
  "술집",
  "룸술집",
  "지역별 술집",
  "바 찾기",
  "맛집",
];

export function buildHomeMetadata(): Metadata {
  const base = getSiteUrl();

  return {
    title: { absolute: defaultTitle },
    description: defaultDescription,
    keywords: baseKeywords,
    alternates: { canonical: `${base}/` },
    openGraph: {
      title: defaultTitle,
      description: defaultDescription,
      url: `${base}/`,
      siteName: "FirePlace",
      locale: "ko_KR",
      type: "website",
    },
  };
}
