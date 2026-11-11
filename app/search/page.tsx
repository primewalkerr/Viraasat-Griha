import type { Metadata } from "next";
import SearchBox from "@/components/SearchBox";
import { popularSearches } from "@/lib/content";
import { listCities, popularSearchTerms } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  const [cities, popular] = await Promise.all([listCities(), popularSearchTerms(popularSearches)]);
  return (
    <main className="main" style={{ gap: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p className="eyebrow">Search</p>
        <h1 className="display h1">Find a craft, city or state</h1>
      </div>
      <SearchBox cities={cities} popular={popular} initial={(Array.isArray(q) ? q[0] : q) ?? ""} />
    </main>
  );
}
