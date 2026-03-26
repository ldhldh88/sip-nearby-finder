import type { Metadata } from "next";
import { redirect } from "next/navigation";
import HomePageClient from "./HomePageClient";
import { buildHomeMetadata } from "@/lib/seo/home-metadata";
import { buildExploreMetadata } from "@/lib/seo/explore-metadata";
import { hasListingSearchParams, listingSearchParamsToQuery } from "@/lib/seo/listing-search-params";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = (await searchParams) ?? {};
  if (hasListingSearchParams(sp)) {
    return buildExploreMetadata(sp);
  }
  return buildHomeMetadata();
}

export default async function Page({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  if (hasListingSearchParams(sp)) {
    const q = listingSearchParamsToQuery(sp);
    redirect(q ? `/explore?${q}` : "/explore");
  }
  return <HomePageClient />;
}
