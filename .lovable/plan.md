

## Plan: 스키마 수정 반영

### 변경사항

**`bar_meta`** — review_count, avg_rating 제거
- `kakao_place_id` (TEXT, PK)
- `view_count` (INT default 0)
- `like_count` (INT default 0)
- `bookmark_count` (INT default 0)
- `hot_score` (NUMERIC default 0)
- `created_at`, `updated_at`

**`themes`** — emoji 제거, icon_url 추가
- `id` (UUID PK)
- `name` (TEXT UNIQUE)
- `icon_url` (TEXT, nullable)
- `created_at`

**`bar_themes`** — 변경 없음 (이미 M:N 구조로 bar는 여러 테마 가능)
- `id` (UUID PK)
- `kakao_place_id` (TEXT FK → bar_meta)
- `theme_id` (UUID FK → themes)
- `user_id` (UUID)
- `created_at`
- UNIQUE(kakao_place_id, theme_id, user_id)

**`bookmarks`** — 변경 없음
- `id` (UUID PK)
- `user_id` (UUID)
- `kakao_place_id` (TEXT FK → bar_meta)
- `theme_id` (UUID FK → themes)
- `created_at`
- UNIQUE(user_id, kakao_place_id, theme_id)

### RLS 정책
- `bar_meta`: 누구나 SELECT, authenticated INSERT/UPDATE
- `themes`: 누구나 SELECT
- `bar_themes`: 누구나 SELECT, 본인만 INSERT/DELETE
- `bookmarks`: 본인만 SELECT/INSERT/DELETE

### 구현 순서
1. DB 마이그레이션 (4 테이블 + RLS)
2. 초기 테마 데이터 삽입 (icon_url은 null로 시작, 추후 이미지 업로드)
3. 이메일 인증 (로그인/회원가입)
4. 조회수 증가 로직 (상세 시트 열릴 때 upsert + view_count++)
5. 북마크/좋아요/테마 태깅 UI

