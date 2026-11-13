import type { Metadata } from "next";
import ArtGrid from "@/components/ArtGrid";
import { getAllProducts } from "@/lib/shopify";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "All art", description: "Every real product in the Viraasat Griha shop." };

export default async function AllArtPage() {
  const items = await getAllProducts();
  return (
    <main className="main">
      <h1 className="display h1">All art</h1>
      <ArtGrid items={items} />
    </main>
  );
}
