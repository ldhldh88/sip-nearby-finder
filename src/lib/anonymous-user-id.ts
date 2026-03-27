/** PostgreSQL uuid / Prisma @db.Uuid 와 호환되는 문자열인지 검사 */
const PG_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidPostgresUuid(s: string): boolean {
  return PG_UUID_RE.test(s.trim());
}

/** crypto.randomUUID 미지원 환경용 RFC 4122 v4 */
export function generateAnonymousUserId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = (Math.random() * 256) | 0;
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const ANONYMOUS_USER_STORAGE_KEY = "fp_anonymous_user_id";

/**
 * localStorage에서 익명 사용자 UUID를 읽거나 새로 만듭니다.
 * 예전 버전의 `Date.now()-...` 형태는 DB에 넣을 수 없어 폐기 후 재발급합니다.
 */
export function readOrCreateAnonymousUserId(): string | null {
  try {
    const existing = localStorage.getItem(ANONYMOUS_USER_STORAGE_KEY)?.trim();
    if (existing && isValidPostgresUuid(existing)) {
      return existing;
    }
    const id = generateAnonymousUserId();
    localStorage.setItem(ANONYMOUS_USER_STORAGE_KEY, id);
    return id;
  } catch {
    return null;
  }
}
