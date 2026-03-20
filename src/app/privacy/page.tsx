import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";
import { getSiteUrl } from "@/lib/site";

const contact =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "FirePlace(파이어플레이스) 개인정보 수집·이용 및 제3자(광고 포함) 안내",
  robots: { index: true, follow: true },
  openGraph: {
    title: "개인정보처리방침 | FirePlace",
    description: "개인정보 처리방침",
    locale: "ko_KR",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="개인정보처리방침">
      <p>
        FirePlace(이하 &quot;서비스&quot;)는 이용자의 개인정보를 중요하게 여기며, 관련 법령에 따라
        개인정보를 안전하게 처리합니다. 본 방침은 서비스 이용 시 적용됩니다.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-foreground">1. 수집하는 항목 및 방법</h2>
        <ul>
          <li>
            <strong>서비스 이용 과정:</strong> 브라우저·단말 정보(접속 로그, 쿠키 등), 이용 기록이 자동으로
            생성·수집될 수 있습니다.
          </li>
          <li>
            <strong>Supabase(백엔드):</strong> 서비스 제공을 위해 Supabase를 사용하며, 프로젝트 설정에 따라
            저장되는 데이터 범위는 해당 인프라 정책을 따릅니다.
          </li>
          <li>
            <strong>카카오 지도:</strong> 지도·장소 검색 기능을 위해 카카오 지도 JavaScript API를 로드하며,
            카카오의 개인정보 처리에 관한 사항은 카카오 정책을 참고해 주세요.
          </li>
          <li>
            <strong>문의:</strong> 문의 시 이메일 등을 직접 제공하시는 경우, 해당 목적 범위 내에서만
            이용합니다.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">2. 이용 목적</h2>
        <ul>
          <li>지역·술집 정보 탐색 서비스 제공 및 개선</li>
          <li>부정 이용 방지, 통계·품질 분석(익명·집계 형태에 한함)</li>
          <li>법령상 의무 이행</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">3. 제3자 제공 및 광고(구글 애드센스)</h2>
        <p>
          본 서비스는 <strong>Google 애드센스</strong> 등을 통해 광고를 게재할 수 있습니다. 광고 제공을 위해
          Google 및 광고 파트너는 쿠키를 사용하여 방문자의 본 서비스 또는 다른 웹사이트 방문 정보를 바탕으로
          맞춤 광고를 게재할 수 있습니다. 맞춤 광고에 대한 자세한 설명 및 설정은{" "}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Google 광고 설정
          </a>
          에서 확인할 수 있습니다.
        </p>
        <p>
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google 광고 정책(광고)
          </a>
          에서 제3자 제공자의 쿠키 사용 방식을 확인할 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">4. 보유 및 파기</h2>
        <p>
          수집 목적 달성 후 지체 없이 파기합니다. 다만 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당
          기간 동안 보관합니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">5. 이용자의 권리</h2>
        <p>
          개인정보 열람·정정·삭제·처리 정지 요구 등 법령상 권리를 행사할 수 있으며, 문의 경로를 통해 요청할 수
          있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">6. 문의</h2>
        <p>
          개인정보 처리와 관련한 문의는{" "}
          {contact ? (
            <a href={`mailto:${contact}`}>{contact}</a>
          ) : (
            <span>서비스 내 &quot;문의&quot; 페이지를 이용해 주세요.</span>
          )}
        </p>
        <p className="text-xs">시행일: 2026년 3월 21일</p>
      </section>

      <p className="text-xs text-muted-foreground/80">사이트 URL: {getSiteUrl()}</p>
    </LegalPageShell>
  );
}
