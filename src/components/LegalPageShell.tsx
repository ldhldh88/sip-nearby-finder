import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";

type LegalPageShellProps = {
  title: string;
  children: React.ReactNode;
};

export default function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-semibold text-foreground transition-colors hover:text-primary">
            ← 홈
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="max-w-[60vw] truncate text-xs text-muted-foreground">{title}</span>
            <DarkModeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 pb-16 text-sm leading-relaxed text-foreground">
        <h1 className="mb-8 text-2xl font-bold tracking-tight">{title}</h1>
        <div className="space-y-6 text-muted-foreground [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
          {children}
        </div>
      </main>
    </div>
  );
}
