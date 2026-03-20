import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const defaultTitle = "FirePlace(파이어플레이스) · 지역별 술집·룸술집 찾기";
const defaultDescription =
  "파이어플레이스(FirePlace)에서 수원·안양·강남 등 지역별 술집, 룸술집, 바 정보를 한눈에 찾아보세요. 테마 필터와 지도로 가고 싶은 곳을 빠르게 검색할 수 있습니다.";

const baseKeywords = [
  "파이어플레이스",
  "FirePlace",
  "술집",
  "룸술집",
  "지역별 술집",
  "바 찾기",
  "맛집",
];

function firstString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v?.trim() || undefined;
}

export function buildHomeMetadata(searchParams: Record<string, string | string[] | undefined>): Metadata {
  const province = firstString(searchParams.province);
  const district = firstString(searchParams.district);
  const base = getSiteUrl();

  if (district) {
    const loc = `${province ?? ""} ${district}`.trim();
    const title = `${district} 술집·룸술집 찾기`;
    const description = `${loc} 지역의 술집, 룸술집, 바, 이자카야 정보를 FirePlace(파이어플레이스)에서 확인해 보세요. 주소·카테고리·테마로 빠르게 탐색할 수 있습니다.`;
    const query = new URLSearchParams();
    if (province) query.set("province", province);
    query.set("district", district);
    const canonical = `${base}/?${query.toString()}`;

    return {
      title,
      description,
      keywords: [...baseKeywords, district, province, `${district} 술집`, `${district} 룸술집`, loc].filter(
        Boolean
      ) as string[],
      alternates: { canonical },
      openGraph: {
        title: `${title} | FirePlace`,
        description,
        url: canonical,
        siteName: "FirePlace",
        locale: "ko_KR",
        type: "website",
      },
    };
  }

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
