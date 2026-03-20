import type { Metadata } from "next";
import Link from "next/link";
import LegalPageShell from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "소개",
  description:
    "FirePlace(파이어플레이스)는 지역별 술집·룸술집 정보를 한곳에서 찾을 수 있는 서비스입니다. 테마 필터와 지도로 가고 싶은 곳을 빠르게 찾아보세요.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "소개 | FirePlace",
    description: "지역별 술집 탐색 서비스 FirePlace 소개",
    locale: "ko_KR",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <LegalPageShell title="서비스 소개">
      <p className="text-foreground">
        <strong>FirePlace</strong>는 지역과 테마를 기준으로 술집 정보를 탐색할 수 있는 웹
        서비스입니다. 인기 장소, 테마 필터, 지도 기반 정보를 활용해 가고 싶은 곳을 빠르게 찾아볼 수 있습니다.
      </p>
      <p>
        장소 정보는 공개 데이터 및 연동된 서비스를 기반으로 제공되며, 실제 영업 여부·메뉴·가격은 방문 전
        업체에 확인하는 것이 좋습니다.
      </p>
      <p>
        <Link href="/contact" className="text-primary underline">
          문의·제휴
        </Link>
        가 필요하면 연락처 페이지를 이용해 주세요.
      </p>
    </LegalPageShell>
  );
}
