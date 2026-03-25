"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function DarkModeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = useMemo(() => {
    // next-themes: SSR 시점에는 resolvedTheme이 안정적이지 않을 수 있어 마운트 이후에만 사용
    if (!mounted) return theme;
    return resolvedTheme;
  }, [mounted, resolvedTheme, theme]);

  const isDark = currentTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="다크모드 토글"
          className={cn(
            "flex items-center justify-center rounded-full border border-border p-2.5 text-foreground transition-colors hover:bg-muted/50",
            className
          )}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? "라이트 모드" : "다크 모드"}</TooltipContent>
    </Tooltip>
  );
}

