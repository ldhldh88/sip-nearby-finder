import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const defaultTitle = "둘러보기 · FirePlace(파이어플레이스) · 지역별 술집·룸술집 찾기";
const defaultDescription =
  "지역·테마·검색으로 술집을 찾아보세요. FirePlace(파이어플레이스)에서 강남·홍대 등 지역별 술집과 지도 뷰를 이용할 수 있습니다.";

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

export function buildExploreMetadata(searchParams: Record<string, string | string[] | undefined>): Metadata {
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
    const canonical = `${base}/explore?${query.toString()}`;

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
    alternates: { canonical: `${base}/explore` },
    openGraph: {
      title: defaultTitle,
      description: defaultDescription,
      url: `${base}/explore`,
      siteName: "FirePlace",
      locale: "ko_KR",
      type: "website",
    },
  };
}
