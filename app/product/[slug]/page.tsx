import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Photo from "@/components/Photo";
import { addToBag } from "@/app/bag/actions";
import { dummyPrice } from "@/lib/content";
import { getCollectionProducts, getShopifyProduct, type ShopifyProduct } from "@/lib/shopify";
import { getProduct, type ArtCard } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const a = await getProduct(slug);
  if (a) return { title: `${a.craft}, ${a.city}`, description: `${a.craft} from ${a.city}, ${a.state}.` };
  const item = await getShopifyProduct(slug);
  return item ? { title: item.title } : { title: "Product not found" };
}

/**
 * Two things can live at this URL: a craft's overview (slug = city-craft, e.g. "madhubani-madhubani-painting")
 * which shows every real piece in that craft's Shopify collection as a grid once one exists, or — when the
 * slug doesn't match any craft — a single real Shopify product looked up directly by its own handle (what
 * each grid card links to).
 */
export default async function ProductPage({ params }: Props) {
  const slug = (await params).slug;
  const a = await getProduct(slug);

  if (a) {
    const items = a.shopLive && a.collectionHandle ? await getCollectionProducts(a.collectionHandle) : [];
    return items.length > 0 ? <CraftGrid craft={a} items={items} /> : <CraftPlaceholder craft={a} />;
  }

  const item = await getShopifyProduct(slug);
  if (!item) notFound();
  return <ItemDetail item={item} />;
}

/** Every real piece in a craft's Shopify collection, each card linking to its own product page. */
function CraftGrid({ craft: a, items }: { craft: ArtCard; items: ShopifyProduct[] }) {
  return (
    <main className="main">
      <p className="eyebrow">{a.category}</p>
      <h1 className="display h1">{a.craft}</h1>
      <p className="lede" style={{ marginBottom: 24 }}>
        From {a.city}, {a.state}. {items.length} piece{items.length === 1 ? "" : "s"} available.
      </p>
      <div className="art-grid">
        {items.map((item) => (
          <Link key={item.handle} href={`/product/${item.handle}`} className="card art-card">
            <div className="img">
              {item.image ? <img src={item.image} alt={item.title} className="ph" /> : null}
            </div>
            <div className="body">
              <span className="craft">{item.title}</span>
              <span className="price">{item.price}</span>
            </div>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <Link className="ghost" href={`/city/${a.citySlug}`}>See the city &amp; story</Link>
      </div>
    </main>
  );
}

/** A single real Shopify product, looked up directly by its own handle (no craft/city framing). */
function ItemDetail({ item }: { item: ShopifyProduct }) {
  return (
    <main className="main">
      <div className="product-detail">
        <div className="product-img">
          {item.image ? <img src={item.image} alt={item.title} /> : null}
        </div>
        <div className="product-info">
          <h1 className="display h1">{item.title}</h1>
          <p className="product-price">{item.price}</p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            {item.variantId && (
              <form action={addToBag}>
                <input type="hidden" name="productSlug" value={item.handle} />
                <button type="submit" className="btn">Add to bag</button>
              </form>
            )}
            <Link className="ghost" href="/art">See more art</Link>
            <Link className="ghost" href="/contact">Ask about this piece</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/** No live collection yet for this craft: the original single-slug placeholder/real-product behaviour. */
async function CraftPlaceholder({ craft: a }: { craft: ArtCard }) {
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
