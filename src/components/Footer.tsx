import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-4 py-6 text-center">
        <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-xs text-muted-foreground">
          <Link href="/about" className="px-2 py-1 transition-colors hover:text-foreground">
            소개
          </Link>
          <span className="text-border">·</span>
          <Link href="/contact" className="px-2 py-1 transition-colors hover:text-foreground">
            술집 등록
          </Link>
          <span className="text-border">·</span>
          <Link href="/contact" className="px-2 py-1 transition-colors hover:text-foreground">
            정보 수정 요청
          </Link>
          <span className="text-border">·</span>
          <Link href="/contact" className="px-2 py-1 transition-colors hover:text-foreground">
            문의
          </Link>
        </nav>

        <nav className="mt-2 flex items-center justify-center gap-x-1 text-[11px] text-muted-foreground/70">
          <Link href="/terms" className="px-2 py-1 transition-colors hover:text-muted-foreground">
            이용약관
          </Link>
          <span className="text-border">·</span>
          <Link href="/privacy" className="px-2 py-1 transition-colors hover:text-muted-foreground">
            개인정보처리방침
          </Link>
        </nav>

        <p className="mt-3 text-[11px] text-muted-foreground/50">© 2026 FirePlace</p>
      </div>
    </footer>
  );
};

export default Footer;
