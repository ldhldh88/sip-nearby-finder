import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리 | 파이어플레이스",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
