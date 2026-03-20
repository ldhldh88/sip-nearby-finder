import { useThemes, Theme } from "@/hooks/useThemes";
import { cn } from "@/lib/utils";

interface ThemeFilterProps {
  selectedThemeId: string | null;
  onSelect: (themeId: string | null) => void;
}

const ThemeFilter = ({ selectedThemeId, onSelect }: ThemeFilterProps) => {
  const { data: themes, isLoading } = useThemes();

  if (isLoading || !themes || themes.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <button
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

export default ThemeFilter;
