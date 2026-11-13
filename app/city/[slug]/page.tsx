import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CityHero from "@/components/CityHero";
import CraftTabs from "@/components/CraftTabs";
import { config } from "@/lib/config";
import { resolveCardPrices } from "@/lib/shopify";
import { getCityPage } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getCityPage((await params).slug);
  if (!page) return { title: "City not found" };
  const { city } = page;
  return {
    title: city.craft ? `${city.name}: ${city.craft}` : city.name,
    description: city.tagline ?? `${city.craft ?? "Crafts"} from ${city.name}, ${city.state}: the story, the making and where to buy.`,
  };
}

export default async function CityPageRoute({ params }: Props) {
  const page = await getCityPage((await params).slug);
  if (!page) notFound();
  const { city, slides, crafts: craftsRaw, stores } = page;
  const cards = craftsRaw.map((c) => ({ ...c, productSlug: `${city.slug}-${c.slug}` }));
  const prices = await resolveCardPrices(cards);
  const crafts = cards.map((c) => ({ ...c, ...prices.get(c.productSlug)! }));
  const category = crafts[0]?.category;
  const checkedDates = stores.map((s) => s.ratingCheckedAt).filter(Boolean).sort();

  return (
    <main>
      <CityHero slides={slides} name={city.name} nameHi={city.nameHi}
        eyebrow={[city.state, category].filter(Boolean).join(" · ")}
        tagline={city.tagline ?? city.craft} />

      <CraftTabs cityName={city.name} crafts={crafts} preview={config.preview} />

      <section className="band" aria-labelledby="buy-h">
        <h2 id="buy-h" className="display h2">Where to buy</h2>
        {stores.length === 0 ? (
          <p className="lede">We are visiting and checking shops in {city.name}. The ones we trust will be listed here.</p>
        ) : (
          <>
            <p className="lede">
              {stores.length === 1 ? "A shop" : `${stores.length} shops`} in {city.name}, each linked to its Google Maps listing.
              {checkedDates.length > 0 && ` Ratings are from Google, as of ${new Date(checkedDates[checkedDates.length - 1]!).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}.`}
            </p>
            <div className="stores">
              {stores.map((s) => {
                const inner = (
                  <>
                    <span className="nm">{s.name}</span>
                    {s.rating != null ? (
                      <span className="rating"><span style={{ color: "var(--madder)" }} aria-hidden="true">★</span> {s.rating.toFixed(1)}{" "}
                        {s.ratingCount != null && <span className="n">({s.ratingCount} Google reviews)</span>}</span>
                    ) : <span className="addr">No Google rating yet</span>}
                    {s.address && <span className="addr">{s.address}</span>}
                    {config.preview && !s.verified && <span><span className="tag tag-warn">not verified</span></span>}
                  </>
                );
                return s.link ? (
                  <a key={s.name} className="card store" href={s.link} target="_blank" rel="noopener noreferrer" aria-label={`${s.name} on Google Maps (opens in a new tab)`}>{inner}</a>
                ) : <div key={s.name} className="store">{inner}</div>;
              })}
            </div>
          </>
        )}
      </section>

      <Link href="/#map" className="back-map" aria-label="Back to the map">Map</Link>
    </main>
  );
}
