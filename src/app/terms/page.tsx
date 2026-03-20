import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "이용약관 | 파이어플레이스",
  description: "파이어플레이스(FirePlace) 서비스 이용에 관한 약관",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPageShell title="이용약관">
      <p>
        본 약관은 파이어플레이스(이하 &quot;서비스&quot;)의 이용과 관련하여 운영자와 이용자 간 권리·의무 및
        책임 사항을 규정합니다.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-foreground">1. 서비스의 성격</h2>
        <p>
          서비스는 공개된 정보 및 제휴 API 등을 바탕으로 지역·업종 등에 따른 술집(음식점) 정보를 탐색할 수
          있도록 제공합니다. 표시되는 영업시간·위치·사진 등은 제3자 데이터에 의존할 수 있으며, 항상 최신·정확함을
          보장하지 않습니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">2. 이용자의 의무</h2>
        <ul>
          <li>법령 및 본 약관을 준수해야 합니다.</li>
          <li>서비스의 안정적 운영을 방해하는 행위를 해서는 안 됩니다.</li>
          <li>미성년자에게 유해하도록 조장하는 방식의 이용을 금지합니다.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">3. 면책</h2>
        <p>
          서비스는 &quot;있는 그대로&quot; 제공됩니다. 운영자는 정보의 정확성, 특정 목적 적합성 등에 대해
          보증하지 않으며, 이용자 간 또는 제3자와의 분쟁에 대해 책임을 지지 않습니다. 음주는 법적 연령과
          현지 규정을 준수해 주세요.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">4. 저작권</h2>
        <p>
          서비스 UI·텍스트·로고 등에 대한 저작권은 운영자 또는 정당한 권리자에게 있습니다. 외부 API·지도 등은
          각 제공자의 약관을 따릅니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">5. 약관의 변경</h2>
        <p>
          운영상 필요 시 약관을 변경할 수 있으며, 변경 후 서비스에 게시함으로써 효력이 발생합니다. 중요한
          변경 시 합리적인 방법으로 안내합니다.
        </p>
      </section>

      <p className="text-xs text-muted-foreground/80">시행일: 2026년 3월 21일</p>
    </LegalPageShell>
  );
}
