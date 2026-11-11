import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Photo from "@/components/Photo";
import { addToBag } from "@/app/bag/actions";
import { dummyPrice } from "@/lib/content";
import { getShopifyProduct } from "@/lib/shopify";
import { getProduct } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getProduct((await params).slug);
  if (!a) return { title: "Product not found" };
  return { title: `${a.craft}, ${a.city}`, description: `${a.craft} from ${a.city}, ${a.state}.` };
}

/** Real price and photo come from Shopify once a product's handle matches this slug; a dummy placeholder otherwise. */
export default async function ProductPage({ params }: Props) {
  const a = await getProduct((await params).slug);
  if (!a) notFound();
  const shopify = await getShopifyProduct(a.productSlug);

  return (
    <main className="main">
      <div className="product-detail">
        <div className="product-img">
          {shopify?.image
            ? <img src={shopify.image} alt={`${a.craft} from ${a.city}`} />
            : <Photo media={a.photo} alt={`${a.craft} from ${a.city}`} />}
        </div>
        <div className="product-info">
          <p className="eyebrow">{a.category}</p>
          <h1 className="display h1">{a.craft}</h1>
          <p className="lede">From {a.city}, {a.state}.</p>
          <p className="product-price">{shopify?.price ?? dummyPrice(a.productSlug)}</p>
          {shopify ? (
            <p className="lede" style={{ maxWidth: 480 }}>
              Made by hand in {a.city}. See the story and the shops that sell it on the {a.city} page.
            </p>
          ) : (
            <p className="lede" style={{ maxWidth: 480 }}>
              This price and page are placeholders. The shop will open here once it is connected to Shopify; until
              then, read the story of {a.craft.toLowerCase()} and see the shops that sell it on the {a.city} page.
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            {shopify && (
              <form action={addToBag}>
                <input type="hidden" name="productSlug" value={a.productSlug} />
                <button type="submit" className="btn">Add to bag</button>
              </form>
            )}
            <Link className={shopify ? "ghost" : "btn"} href={`/city/${a.citySlug}`}>See the city &amp; story</Link>
            <Link className="ghost" href="/contact">Ask about this piece</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
