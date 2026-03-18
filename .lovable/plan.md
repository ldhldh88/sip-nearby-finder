

## Plan: 관리자 페이지 (`/admin`) — 테마 연결 관리

### 보안 방식
비밀번호를 클라이언트 코드에 하드코딩하면 누구나 소스에서 볼 수 있으므로, 서버 측에서 검증합니다:
- **`ADMIN_PASSWORD`** 시크릿을 백엔드에 저장 (값: `1234`)
- **`admin-auth` 엣지 함수** 생성 — 비밀번호를 받아 서버에서 검증 후 세션 토큰 반환
- 프론트에서는 토큰을 sessionStorage에 저장하여 관리자 상태 유지

### 구현 항목

**1. 엣지 함수: `admin-auth`**
- POST로 비밀번호 수신 → `ADMIN_PASSWORD` 시크릿과 비교
- 일치 시 간단한 서명 토큰 반환, 불일치 시 401

**2. 관리자 페이지: `/admin`**
- 비밀번호 입력 화면 (미인증 시)
- 인증 후 관리 화면:
  - **술집 검색**: 기존 카카오 검색 API 활용 (지역 선택 + 키워드 검색)
  - **테마 목록**: `themes` 테이블에서 로드
  - **테마 연결**: 선택한 술집에 테마 체크박스로 태깅 → `bar_meta` upsert + `bar_themes` INSERT
  - **현재 연결된 테마 표시**: 술집 선택 시 이미 연결된 테마 하이라이트

**3. 라우트 추가**
- `App.tsx`에 `/admin` 라우트 추가

### 데이터 흐름
```text
[관리자] → 비밀번호 입력 → admin-auth 엣지함수 검증 → 토큰 발급
    ↓
술집 검색 (카카오 API) → 술집 선택 → 테마 체크 → bar_meta upsert + bar_themes insert
```

### 파일 변경
- `supabase/functions/admin-auth/index.ts` (신규)
- `src/pages/Admin.tsx` (신규)
- `src/App.tsx` (라우트 추가)
- 시크릿 `ADMIN_PASSWORD` 추가

