"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutList, Map } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewModeFabProps = {
  viewMode: "list" | "map";
  onSwitchToMap: () => void;
  onSwitchToList: () => void;
  /** 상세 시트가 열려 있으면 FAB을 숨겨 시트·배경 위로 겹치지 않게 함 */
  hidden?: boolean;
};

/** 지도/목록 전환 FAB — `body` 포털·높은 z-index, 시각은 작은 알약형 */
export default function ViewModeFab({
  viewMode,
  onSwitchToMap,
  onSwitchToList,
  hidden = false,
}: ViewModeFabProps) {
  const [mounted, setMounted] = useState(false);
  /** 터치에서 pointerdown으로 이미 전환했을 때 이어지는 click 한 번 무시 (이중 토글 방지) */
  const skipClickRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || hidden) return null;

  const isList = viewMode === "list";

  const handleSwitch = () => {
    if (isList) onSwitchToMap();
    else onSwitchToList();
  };

  const node = (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[10050] flex justify-center">
      <div className="pointer-events-none flex w-full justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2">
        <button
          type="button"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            // 터치/펜은 pointerdown에서 즉시 전환 — 모바일에서 첫 탭이 click으로 늦게 가며 무시되는 현상 완화
            if (e.pointerType === "touch" || e.pointerType === "pen") {
              e.preventDefault();
              skipClickRef.current = true;
              handleSwitch();
            }
          }}
          onClick={() => {
            if (skipClickRef.current) {
              skipClickRef.current = false;
              return;
            }
            handleSwitch();
          }}
          className={cn(
            "pointer-events-auto inline-flex touch-manipulation select-none items-center justify-center gap-1.5",
            "min-h-[44px] min-w-[44px] rounded-full border border-border bg-background px-4 py-2",
            "text-sm font-medium text-foreground backdrop-blur-sm",
            "transition-transform active:scale-[0.98]",
            "[-webkit-tap-highlight-color:transparent]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          )}
          aria-label={isList ? "지도로 보기" : "목록으로 돌아가기"}
        >
          {isList ? (
            <Map className="h-4 w-4 shrink-0 pointer-events-none" strokeWidth={2} aria-hidden />
          ) : (
            <LayoutList className="h-4 w-4 shrink-0 pointer-events-none" strokeWidth={2} aria-hidden />
          )}
          {isList ? "지도" : "목록"}
        </button>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
