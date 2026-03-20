import { useQuery } from "@tanstack/react-query";

export interface BarMeta {
  like_count: number;
  view_count: number;
  bookmark_count: number;
  hot_score: number;
}

const EMPTY_META: BarMeta = { like_count: 0, view_count: 0, bookmark_count: 0, hot_score: 0 };

export type BarMetaMap = Record<string, BarMeta>;

export function useBarMeta(placeIds: string[]) {
  return useQuery({
    queryKey: ["bar-meta", placeIds],
    queryFn: async (): Promise<BarMetaMap> => {
      if (placeIds.length === 0) return {};

      const res = await fetch(
        `/api/bar-meta?placeIds=${encodeURIComponent(placeIds.join(","))}`
      );
      if (!res.ok) throw new Error(`bar-meta fetch failed: ${res.status}`);
      return (await res.json()) as BarMetaMap;
    },
    enabled: placeIds.length > 0,
    staleTime: 30_000,
  });
}

/** Compute a composite popularity score for sorting */
export function computePopularity(meta: BarMeta): number {
  // hot_score already factors time-weighted views, likes, bookmarks
  // But we also blend in raw counts for tie-breaking
  return meta.hot_score * 10 + meta.like_count * 3 + meta.bookmark_count * 2 + meta.view_count * 0.1;
}

/** @deprecated Use useBarMeta instead */
export function useBarLikeCounts(placeIds: string[]) {
  const query = useBarMeta(placeIds);
  return {
    ...query,
    data: query.data
      ? Object.fromEntries(
          Object.entries(query.data).map(([id, meta]) => [id, meta.like_count])
        )
      : undefined,
  };
}
