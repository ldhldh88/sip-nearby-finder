/** 지역 목록 URL에 쓰이는 쿼리가 있는지 (홈 → 둘러보기 리다이렉트용) */
export function hasListingSearchParams(
  sp: Record<string, string | string[] | undefined>
): boolean {
  const p = sp.province;
  const d = sp.district;
  const has = (v: string | string[] | undefined) =>
    v !== undefined && (Array.isArray(v) ? v[0] !== undefined && v[0] !== "" : String(v).trim() !== "");
  return has(p) || has(d);
}

export function listingSearchParamsToQuery(
  sp: Record<string, string | string[] | undefined>
): string {
  const province = Array.isArray(sp.province) ? sp.province[0] : sp.province;
  const district = Array.isArray(sp.district) ? sp.district[0] : sp.district;
  const q = new URLSearchParams();
  if (province && String(province).trim()) q.set("province", String(province).trim());
  if (district && String(district).trim()) q.set("district", String(district).trim());
  return q.toString();
}
