import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

export const metadata: Metadata = {
  title: "문의 | FirePlace",
  description: "FirePlace 문의 및 정보 수정 요청",
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <LegalPageShell title="문의">
      <p>
        술집 <strong>등록</strong>, <strong>정보 수정</strong>, <strong>오류 신고</strong> 등은 아래 경로로
        연락해 주세요. 검토 후 가능한 범위에서 반영합니다.
      </p>
      {email ? (
        <p>
          이메일:{" "}
          <a href={`mailto:${email}`} className="font-medium text-primary">
            {email}
          </a>
        </p>
      ) : (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-muted-foreground">
          운영 이메일이 아직 설정되지 않았습니다. 사이트 관리자에게{" "}
          <code className="rounded bg-muted px-1 text-xs">NEXT_PUBLIC_CONTACT_EMAIL</code> 환경 변수 설정을
          요청해 주세요.
        </p>
      )}
      <section>
        <h2 className="text-lg font-semibold text-foreground">안내</h2>
        <ul>
          <li>제목에 지역·업체명을 적어 주시면 처리에 도움이 됩니다.</li>
          <li>답변은 운영 상황에 따라 지연될 수 있습니다.</li>
        </ul>
      </section>
    </LegalPageShell>
  );
}
