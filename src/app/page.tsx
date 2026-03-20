import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";
import { buildHomeMetadata } from "@/lib/seo/home-metadata";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = (await searchParams) ?? {};
  return buildHomeMetadata(sp);
}

export default function Page() {
  return <HomePageClient />;
}
