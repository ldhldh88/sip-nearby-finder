import { useInfiniteQuery } from "@tanstack/react-query";
import { KakaoPlace } from "@/lib/kakao";
import type { BarMetaMap } from "@/hooks/useBarLikeCounts";
import { useMemo } from "react";

export interface DistrictBarsPage {
  places: KakaoPlace[];
  metaMap: BarMetaMap;
  total: number;
}

export function useInfiniteDistrictBars(
  districtName: string | null,
  pageSize = 5
) {
  const query = useInfiniteQuery({
    queryKey: ["district-bars", districtName, pageSize],
    enabled: !!districtName,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await fetch(
        `/api/district-bars?districtName=${encodeURIComponent(
          districtName as string
        )}&limit=${pageSize}&offset=${pageParam}`
      );
      if (!res.ok)
        throw new Error(`district-bars fetch failed: ${res.status}`);
      return (await res.json()) as DistrictBarsPage;
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.places.length, 0);
      if (typeof lastPage.total === "number") {
        return loaded < lastPage.total ? loaded : undefined;
      }
      // Fallback: if total is missing, load while we still get full pages.
      return lastPage.places.length === pageSize ? loaded : undefined;
    },
    staleTime: 30_000,
  });

  const places = useMemo(() => {
    return query.data?.pages.flatMap((p) => p.places) ?? [];
  }, [query.data]);

  const metaMap = useMemo(() => {
    const merged: BarMetaMap = {};
    for (const page of query.data?.pages ?? []) {
      Object.assign(merged, page.metaMap ?? {});
    }
    return merged;
  }, [query.data]);

  const total = query.data?.pages?.[0]?.total ?? 0;

  return {
    ...query,
    places,
    metaMap,
    total,
  };
}

