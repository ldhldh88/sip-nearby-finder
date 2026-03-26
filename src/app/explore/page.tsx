import type { Metadata } from "next";
import ExplorePageClient from "./ExplorePageClient";
import { buildExploreMetadata } from "@/lib/seo/explore-metadata";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = (await searchParams) ?? {};
  return buildExploreMetadata(sp);
}

export default function ExplorePage() {
  return <ExplorePageClient />;
}
