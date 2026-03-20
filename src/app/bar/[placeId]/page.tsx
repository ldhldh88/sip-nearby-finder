import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BarPlacePage from "@/views/BarPlacePage";
import { getCachedPlaceByKakaoId } from "@/lib/seo/get-cached-place";
import { buildBarJsonLd } from "@/lib/seo/bar-jsonld";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

type PageProps = { params: Promise<{ placeId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { placeId: raw } = await params;
  const placeId = decodeURIComponent(raw);
  const data = await getCachedPlaceByKakaoId(placeId);
  if (!data) notFound();

  const { place, districtName, provinceName } = data;
  const base = getSiteUrl();
  const canonical = `${base}/bar/${encodeURIComponent(place.id)}`;
  const title = `${place.place_name} · ${districtName} 술집`;
  const description = `${place.place_name} — ${provinceName} ${districtName} 지역. ${place.category_name}. ${place.road_address_name || place.address_name || ""} FirePlace(파이어플레이스)에서 주소·카테고리·지도 정보를 확인하세요.`;

  return {
    title,
    description,
    keywords: [
      place.place_name,
      `${districtName} 술집`,
      `${districtName} 룸술집`,
      provinceName,
      districtName,
      "파이어플레이스",
      "FirePlace",
      "술집",
      "룸술집",
    ],
    alternates: { canonical },
    openGraph: {
      title: `${title} | FirePlace`,
      description,
      url: canonical,
      siteName: "FirePlace",
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | FirePlace`,
      description,
    },
  };
}

export default async function BarPlaceRoute({ params }: PageProps) {
  const { placeId: raw } = await params;
  const placeId = decodeURIComponent(raw);
  const data = await getCachedPlaceByKakaoId(placeId);
  if (!data) notFound();

  const jsonLd = buildBarJsonLd(data.place, data.districtName, data.provinceName);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BarPlacePage
        place={data.place}
        districtName={data.districtName}
        provinceName={data.provinceName}
      />
    </>
  );
}
