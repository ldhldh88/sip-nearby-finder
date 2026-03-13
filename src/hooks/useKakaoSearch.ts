import { useQuery } from "@tanstack/react-query";
import { searchBars, KakaoPlace } from "@/lib/kakao";

export function useKakaoSearch(district: string | null) {
  return useQuery({
    queryKey: ["kakao-bars", district],
    queryFn: () => searchBars(district!),
    enabled: !!district,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

// Extract a short category from Kakao's full category path
export function getShortCategory(categoryName: string): string {
  const parts = categoryName.split(" > ");
  // e.g. "음식점 > 술집 > 호프/맥주" → "호프/맥주"
  return parts[parts.length - 1] || "술집";
}

// Map category to color classes
const categoryColorMap: Record<string, string> = {
  "호프/맥주": "bg-sky-100 text-sky-800",
  "칵테일바": "bg-violet-100 text-violet-800",
  "와인바": "bg-red-100 text-red-800",
  "이자카야": "bg-rose-100 text-rose-800",
  "요리주점": "bg-amber-100 text-amber-800",
  "포장마차": "bg-orange-100 text-orange-800",
  "라운지바": "bg-indigo-100 text-indigo-800",
  "민속주점": "bg-emerald-100 text-emerald-800",
  "실내포장마차": "bg-orange-100 text-orange-800",
  "오뎅/꼬치": "bg-yellow-100 text-yellow-800",
};

export function getCategoryColor(shortCategory: string): string {
  return categoryColorMap[shortCategory] || "bg-muted text-muted-foreground";
}
