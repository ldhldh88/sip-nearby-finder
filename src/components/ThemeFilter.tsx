import { LayoutGrid, Wine } from "lucide-react";
import { useThemes, Theme } from "@/hooks/useThemes";
import { cn } from "@/lib/utils";

interface ThemeFilterProps {
  selectedThemeId: string | null;
  onSelect: (themeId: string | null) => void;
  /** home: 메인 화면용 흑백 톤 필터 */
  variant?: "default" | "home";
  className?: string;
}

const ThemeFilter = ({
  selectedThemeId,
  onSelect,
  variant = "default",
  className,
}: ThemeFilterProps) => {
  const { data: themes, isLoading } = useThemes();

  if (isLoading || !themes || themes.length === 0) return null;

  if (variant === "home") {
    return (
      <section className={cn("space-y-3", className)}>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">분위기</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              selectedThemeId === null
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground hover:bg-muted/50"
            )}
          >
            <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            전체
          </button>
          {themes.map((theme) => (
            <ThemeChipHome
              key={theme.id}
              theme={theme}
              selected={selectedThemeId === theme.id}
              onClick={() => onSelect(selectedThemeId === theme.id ? null : theme.id)}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className={cn("mb-4 flex flex-wrap gap-2", className)}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          selectedThemeId === null
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        전체
      </button>
      {themes.map((theme) => (
        <button
          type="button"
          key={theme.id}
          onClick={() => onSelect(selectedThemeId === theme.id ? null : theme.id)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            selectedThemeId === theme.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {theme.name}
        </button>
      ))}
    </div>
  );
};

function ThemeChipHome({
  theme,
  selected,
  onClick,
}: {
  theme: Theme;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        selected
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background text-foreground hover:bg-muted/50"
      )}
    >
      {theme.icon_url ? (
        <img
          src={theme.icon_url}
          alt=""
          className="h-4 w-4 shrink-0 rounded object-cover grayscale"
          width={16}
          height={16}
        />
      ) : (
        <Wine className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
      )}
      <span className="min-w-0 truncate">{theme.name}</span>
    </button>
  );
}

export default ThemeFilter;
