import { useInfiniteQuery } from "@tanstack/react-query";
import { KakaoPlace } from "@/lib/kakao";
import { useMemo } from "react";

export interface ThemeFilteredBarsPage {
  places: KakaoPlace[];
  themeMap: Record<string, string[]>;
  total: number;
}

export function useInfiniteThemeFilteredBars(
  themeId: string | null,
  districtName: string | null,
  pageSize = 5
) {
  const query = useInfiniteQuery({
    queryKey: ["theme-filtered-bars", themeId, districtName, pageSize],
    enabled: !!themeId && !!districtName,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await fetch(
        `/api/theme-filtered-bars?themeId=${encodeURIComponent(
          themeId as string
        )}&districtName=${encodeURIComponent(
          districtName as string
        )}&limit=${pageSize}&offset=${pageParam}`
      );
      if (!res.ok)
        throw new Error(`theme-filtered-bars fetch failed: ${res.status}`);
      return (await res.json()) as ThemeFilteredBarsPage;
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.places.length, 0);
      if (typeof lastPage.total === "number") {
        return loaded < lastPage.total ? loaded : undefined;
      }
      return lastPage.places.length === pageSize ? loaded : undefined;
    },
    staleTime: 60_000,
  });

  const places = useMemo(() => {
    return query.data?.pages.flatMap((p) => p.places) ?? [];
  }, [query.data]);

  const themeMap = useMemo(() => {
    const merged: Record<string, string[]> = {};
    for (const page of query.data?.pages ?? []) {
      Object.assign(merged, page.themeMap ?? {});
    }
    return merged;
  }, [query.data]);

  const total = query.data?.pages?.[0]?.total ?? 0;

  return {
    ...query,
    places,
    themeMap,
    total,
  };
}

