

## 변경 사항

### 1. 캐싱 주기 변경 (`src/hooks/useKakaoSearch.ts`)
- `staleTime`을 `5 * 60 * 1000` (5분) → `24 * 60 * 60 * 1000` (24시간)으로 변경
- `gcTime`도 24시간으로 설정하여 캐시가 유지되도록 함

### 2. 좌표 기반 → 키워드 기반 검색으로 변경 (`src/lib/kakao.ts`)
현재 `searchBars`에서 좌표(`x`, `y`, `radius`)를 함께 전달하고 있음. 이를 제거하고 순수 키워드 검색만 사용.

- `DISTRICT_COORDS` 맵과 `getDistrictCoords` 함수 제거
- `searchBars`에서 좌표 파라미터 설정 로직 제거 (lines 150-155)
- 키워드만으로 검색: `"{지역명} 술집"` 쿼리를 `query`, `page`, `size`, `sort` 파라미터만으로 전송

### 3. Edge Function 정리 (`supabase/functions/kakao-proxy/index.ts`)
- `x`, `y`, `radius` 파라미터 처리 코드는 유지 (검색바의 `useBarSearch`에서 사용할 수 있으므로) — 실제로 확인하면 사용하지 않으므로 함께 제거

변경 파일: `src/hooks/useKakaoSearch.ts`, `src/lib/kakao.ts`

