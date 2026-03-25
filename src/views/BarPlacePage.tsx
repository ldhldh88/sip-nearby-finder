"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import type { KakaoPlace } from "@/lib/kakao";
import { usePlaceDistricts } from "@/hooks/usePlaceDistricts";
import { useBarThemes, useThemes } from "@/hooks/useThemes";
import { useRegionsRaw } from "@/hooks/useRegions";
import DarkModeToggle from "@/components/DarkModeToggle";
import NaverMapEmbed from "@/components/NaverMapEmbed";

type BarPlacePageProps = {
  place: KakaoPlace;
  districtName: string;
  provinceName: string;
};

const BarPlacePage = ({ place, districtName, provinceName }: BarPlacePageProps) => {
  const queryClient = useQueryClient();

  // Connected district (동네) info
  const { data: districtMap, isLoading: isDistrictsLoading } = usePlaceDistricts([place.id]);
  const districtInfo = districtMap?.[place.id];
  const hasDistrict = !!districtInfo?.districtId;

  const { data: themes, isLoading: isThemesLoading } = useThemes();

  const { data: regionsData, isLoading: isRegionsLoading } = useRegionsRaw();

  const themesById = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    (themes ?? []).forEach((t) => map.set(t.id, { id: t.id, name: t.name }));
    return map;
  }, [themes]);

  // Anonymous user id for theme tagging (no login required)
  const [anonUserId, setAnonUserId] = useState<string | null>(null);
  useEffect(() => {
    const key = "fp_anonymous_user_id";
    try {
      const existing = localStorage.getItem(key);
      if (existing) {
        setAnonUserId(existing);
        return;
      }
      const newId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(key, newId);
      setAnonUserId(newId);
    } catch {
      // If localStorage is unavailable, theme saving will be disabled.
      setAnonUserId(null);
    }
  }, []);

  // Connected themes info (카카오 "장소 카테고리"가 아니라, 앱 테마)
  const { data: barThemesMap, isLoading: isBarThemesLoading } = useBarThemes([place.id], anonUserId);
  const themeIds = barThemesMap?.[place.id] ?? [];

  // District (동네) selection state
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [isSavingDistrict, setIsSavingDistrict] = useState(false);

  // Theme selection state
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [didInitThemes, setDidInitThemes] = useState(false);
  const [isSavingThemes, setIsSavingThemes] = useState(false);

  const address = place.road_address_name || place.address_name || "";
  const naverQuery = place.road_address_name || place.address_name || place.place_name || "";
  const naverMapsHref = useMemo(() => {
    if (!naverQuery.trim()) return null;
    return `https://map.naver.com/?query=${encodeURIComponent(naverQuery)}`;
  }, [naverQuery]);

  const naverMapClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const naverLat = useMemo(() => {
    const v = parseFloat(place.y);
    return Number.isFinite(v) ? v : null;
  }, [place.y]);
  const naverLng = useMemo(() => {
    const v = parseFloat(place.x);
    return Number.isFinite(v) ? v : null;
  }, [place.x]);
  const canRenderNaverEmbed = !!naverMapClientId && naverLat !== null && naverLng !== null;

  const mapsHref = useMemo(() => {
    const lat = place.y;
    const lng = place.x;
    if (!lat || !lng) return null;
    return `https://map.kakao.com/link/map/${encodeURIComponent(place.place_name)},${lat},${lng}`;
  }, [place]);

  const handleSaveDistrict = async () => {
    if (!selectedDistrictId) return;
    setIsSavingDistrict(true);
    try {
      const res = await fetch("/api/cached-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district_id: selectedDistrictId,
          kakao_place_id: place.id,
          place_data: place,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
      }
      toast.success("동네에 등록되었어요!");
      queryClient.invalidateQueries({ queryKey: ["place-districts"] });
    } catch (e) {
      console.error(e);
      toast.error("등록에 실패했어요");
    } finally {
      setIsSavingDistrict(false);
    }
  };

  const handleToggleTheme = (themeId: string) => {
    setSelectedThemeIds((prev) => {
      if (prev.includes(themeId)) return prev.filter((id) => id !== themeId);
      return [...prev, themeId];
    });
  };

  // Initialize selection from server state once per (place, user).
  useEffect(() => {
    setDidInitThemes(false);
    setSelectedThemeIds([]);
  }, [place.id, anonUserId]);

  useEffect(() => {
    if (didInitThemes) return;
    if (!anonUserId) return;
    if (isBarThemesLoading) return;
    setSelectedThemeIds(themeIds);
    setDidInitThemes(true);
  }, [didInitThemes, anonUserId, isBarThemesLoading, themeIds]);

  const handleSaveThemes = async () => {
    if (!anonUserId) {
      toast.error("테마 등록 준비가 안 되었어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setIsSavingThemes(true);
    try {
      const res = await fetch("/api/bar-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kakao_place_id: place.id,
          user_id: anonUserId,
          theme_ids: selectedThemeIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
      }

      toast.success(
        selectedThemeIds.length === 0 ? "테마 연결을 해제했어요!" : "테마가 업데이트되었어요!"
      );
      queryClient.invalidateQueries({ queryKey: ["bar-themes"] });
    } catch (e) {
      console.error(e);
      toast.error("테마 등록에 실패했어요");
    } finally {
      setIsSavingThemes(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 h-14 border-b border-border backdrop-blur-md bg-background/80">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-semibold text-foreground transition-colors hover:text-primary">
            ← 홈
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="max-w-[60vw] truncate text-xs text-muted-foreground">가게 정보</span>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-24">
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm" itemScope itemType="https://schema.org/BarOrPub">
          <h1 className="text-2xl font-bold tracking-tight text-foreground" itemProp="name">
            {place.place_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {provinceName} · {districtName}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-foreground" itemProp="description">
            {place.category_name} · {address}
            {place.phone ? ` · 전화 ${place.phone}` : ""}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                카카오맵에서 보기
              </a>
            ) : null}
            {naverMapsHref ? (
              <a
                href={naverMapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                네이버지도에서 보기
              </a>
            ) : null}
            <Link href="/" className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium">
              다른 술집 찾기
            </Link>
          </div>
        </article>

        {/* Naver Map */}
        <section className="mt-6">
          {canRenderNaverEmbed ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">네이버 지도</p>
              <div className="mt-3 h-64 overflow-hidden rounded-lg border border-border">
                <NaverMapEmbed
                  clientId={naverMapClientId as string}
                  lat={naverLat ?? 0}
                  lng={naverLng ?? 0}
                  zoom={16}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">네이버 지도는 설정이 필요해요.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                <code className="rounded bg-muted px-1">NEXT_PUBLIC_NAVER_MAP_CLIENT_ID</code>
                를 설정한 뒤 다시 새로고침해 주세요.
              </p>
            </div>
          )}
        </section>

        {/* Connected district */}
        <section className="mt-6">
          {isDistrictsLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              동네 정보를 불러오는 중...
            </div>
          ) : hasDistrict && districtInfo?.districtName ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
              <MapPin className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-foreground">
                연결된 지역:{" "}
                <span className="text-primary">{districtInfo.districtName}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
              <p className="mb-2 text-xs font-medium text-primary">
                <MapPin className="mr-1 inline-block h-3 w-3" />
                이 술집이 속한 동네를 선택해 주세요
              </p>

              {isRegionsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  로딩 중...
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">동네 선택…</option>
                      {(regionsData?.provinces ?? []).map((p) => (
                        <optgroup key={p.id} label={p.name}>
                          {(regionsData?.districts ?? [])
                            .filter((d) => d.province_id === p.id)
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleSaveDistrict}
                      disabled={!selectedDistrictId || isSavingDistrict}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
                    >
                      {isSavingDistrict ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          등록 중…
                        </>
                      ) : (
                        "등록"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* Connected themes */}
        <section className="mt-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">연결된 테마</p>

            {anonUserId === null || isBarThemesLoading ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                테마 정보를 불러오는 중...
              </div>
            ) : themeIds.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {themeIds.map((themeId) => (
                  <span
                    key={themeId}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {themesById.get(themeId)?.name ?? themeId}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-medium text-foreground">등록된 테마가 없어요</p>
            )}

            <div className="mt-4 border-t border-border/60 pt-4">
              <p className="text-sm font-medium text-foreground">테마 선택/수정</p>
              <p className="mt-1 text-xs text-muted-foreground">
                이미 연결된 테마가 있어도 아래에서 다시 선택 후 저장할 수 있어요.
              </p>

              {anonUserId === null || isBarThemesLoading || !didInitThemes ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  테마를 준비하는 중...
                </div>
              ) : isThemesLoading || !themes ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  로딩 중...
                </div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {themes.map((t) => {
                      const selected = selectedThemeIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleToggleTheme(t.id)}
                          className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-card-foreground hover:bg-muted/50"
                          }`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleSaveThemes}
                      disabled={isSavingThemes || !anonUserId}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
                    >
                      {isSavingThemes ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        "저장"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BarPlacePage;
