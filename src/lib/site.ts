/** 배포 도메인 (끝 슬래시 없음). 미설정 시 프로덕션 기본 도메인. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw?.trim()) return raw.replace(/\/$/, "");
  return "https://fireplc.com";
}
