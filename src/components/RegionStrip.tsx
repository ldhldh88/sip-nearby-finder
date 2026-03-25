"use client";

import { useMemo } from "react";
import { Building2, ChevronRight, Landmark, MapPinned, Store } from "lucide-react";
import { useRegions } from "@/hooks/useRegions";
import { cn } from "@/lib/utils";

const ICONS = [MapPinned, Building2, Landmark, Store] as const;

function iconForIndex(i: number) {
  return ICONS[i % ICONS.length];
}

function shortLabel(name: string) {
  const first = name.split("/")[0]?.trim() ?? name;
  return first.length > 6 ? `${first.slice(0, 5)}…` : first;
}

interface RegionStripProps {
  selectedProvince: string;
  selectedDistrict: string | null;
  onSelectDistrict: (province: string, district: string) => void;
  onOpenSelector: () => void;
  maxItems?: number;
  className?: string;
}

const RegionStrip = ({
  selectedProvince,
  selectedDistrict,
  onSelectDistrict,
  onOpenSelector,
  maxItems = 14,
  className,
}: RegionStripProps) => {
  const { data: regions, isLoading } = useRegions();

  const districts = useMemo(() => {
    const r = regions?.find((x) => x.province === selectedProvince);
    return (r?.districts ?? []).slice(0, maxItems);
  }, [regions, selectedProvince, maxItems]);

  if (isLoading || !regions?.length) return null;

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">지역</h3>
        <button
          type="button"
          onClick={onOpenSelector}
          className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          전체 보기
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 pl-1 pr-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {districts.map((district, i) => {
          const Icon = iconForIndex(i);
          const selected = selectedDistrict === district;
          return (
            <button
              key={district}
              type="button"
              onClick={() => onSelectDistrict(selectedProvince, district)}
              className="flex min-w-[4.5rem] max-w-[4.75rem] flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full border transition-colors",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <span
                className={cn(
                  "w-full text-center text-[11px] leading-tight",
                  selected ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {shortLabel(district)}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenSelector}
          className="flex min-w-[4.5rem] max-w-[4.75rem] flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border bg-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground">
            <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <span className="w-full text-center text-[11px] leading-tight text-muted-foreground">더보기</span>
        </button>
      </div>
    </section>
  );
};

export default RegionStrip;
