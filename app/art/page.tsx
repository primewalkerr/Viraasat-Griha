import type { Metadata } from "next";
import ArtGrid from "@/components/ArtGrid";
import { resolvePrices } from "@/lib/shopify";
import { listArt } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "All art", description: "Every craft on Viraasat Griha, by city and state." };

export default async function AllArtPage() {
  const raw = await listArt();
  const prices = await resolvePrices(raw.map((a) => a.productSlug));
  const items = raw.map((a) => ({ ...a, ...prices.get(a.productSlug)! }));
  return (
    <main className="main">
      <h1 className="display h1">All art</h1>
      <ArtGrid items={items} soonLabel="Coming soon" />
    </main>
  );
}
