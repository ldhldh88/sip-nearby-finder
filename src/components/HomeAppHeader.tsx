"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "추천" },
  { href: "/explore", label: "둘러보기" },
] as const;

interface HomeAppHeaderProps {
  regionLabel?: string;
  onOpenRegion?: () => void;
  title?: string;
  /** 지역 라벨·지도 핀 (둘러보기 등) */
  showRegionControls?: boolean;
}

export default function HomeAppHeader({
  regionLabel = "",
  onOpenRegion,
  title = "FirePlace",
  showRegionControls = false,
}: HomeAppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* 3열 그리드: 좌·우는 동일 1fr, 가운데는 auto → 네비가 항상 컨테이너 기하학적 중앙 */}
      <div className="mx-auto grid h-full w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 px-4 sm:gap-x-3">
        <div className="flex min-w-0 items-center justify-self-start">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 sm:gap-2.5"
            aria-label="홈으로"
          >
            <img
              src="/logo.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0"
              aria-hidden
            />
            <span className="truncate text-lg font-semibold leading-none tracking-[-0.02em] text-foreground">
              {title}
            </span>
            <span className="hidden shrink-0 border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
              Beta
            </span>
          </Link>
        </div>

        <nav
          className="flex shrink-0 items-center justify-center gap-0.5 sm:gap-2 justify-self-center"
          aria-label="주요 메뉴"
        >
          {NAV_ITEMS.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/" || pathname === ""
                : pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex min-w-[4.75rem] shrink-0 items-center justify-center rounded-md px-2 py-1.5 text-center text-xs font-semibold transition-colors sm:min-w-[5.75rem] sm:px-3 sm:text-sm",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 items-center justify-end justify-self-end gap-1.5 sm:gap-2">
          {showRegionControls && onOpenRegion && (
            <>
              <p
                className="hidden max-w-[min(12rem,40vw)] truncate text-right text-xs text-muted-foreground sm:block"
                title={regionLabel}
              >
                {regionLabel}
              </p>
              <button
                type="button"
                onClick={onOpenRegion}
                className="flex shrink-0 items-center justify-center rounded-full border border-border p-2.5 text-foreground transition-colors hover:bg-muted/50"
                aria-label="지역 선택"
              >
                <MapPin className="h-5 w-5" />
              </button>
            </>
          )}
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
