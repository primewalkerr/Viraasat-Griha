import Link from "next/link";
import BestStrip from "@/components/BestStrip";
import CraftMap from "@/components/CraftMap";
import HeroVideo from "@/components/HeroVideo";
import Photo from "@/components/Photo";
import { brand, home } from "@/lib/content";
import { config } from "@/lib/config";
import { resolveCardPrices } from "@/lib/shopify";
import { heroVideo, listArt, listCities } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [cities, film, art] = await Promise.all([listCities(), heroVideo(), listArt()]);
  const bestRaw = art.filter((a) => a.photo).slice(0, 8);
  const prices = await resolveCardPrices(bestRaw);
  const best = bestRaw.map((a) => ({ ...a, ...prices.get(a.productSlug)! }));

  return (
    <main>
      <section className="hero" aria-labelledby="hero-h">
        {film && <HeroVideo src={film.src} poster={film.poster ?? undefined} />}
        <div className="hero-shade" />
        <p className="hero-eyebrow">{brand.eyebrow}</p>
        <h1 id="hero-h" className="hero-title">{brand.name}</h1>
        <p className="hero-hi" lang="hi">{brand.nameHi}</p>
        <p className="hero-tag">{brand.tagline}</p>
        <a href="#map" className="btn btn-light">Explore the map</a>
      </section>

      {best.length > 0 && (
        <section id="best" className="best" aria-labelledby="best-h">
          <div className="best-head wrap">
            <h2 id="best-h" className="display h2s">{home.bestHeading}</h2>
            <Link href="/art" className="ghost" style={{ minHeight: 48, fontSize: 15 }}>View all <span aria-hidden="true">→</span></Link>
          </div>
          <BestStrip items={best} />
        </section>
      )}

      <CraftMap cities={cities} />

      <section id="cities" className="regions" aria-labelledby="cities-h">
        <h2 id="cities-h" className="display h2" style={{ textAlign: "center" }}>{home.regionsHeading}</h2>
        {cities.length === 0 ? (
          <p className="lede" style={{ margin: "0 auto", textAlign: "center" }}>Cities are being prepared. Please check back soon.</p>
        ) : (
          <div className="grid-cards">
            {cities.map((c) => (
              <Link key={c.slug} href={`/city/${c.slug}`} className="card city-card">
                <div className="img"><Photo media={c.photo} alt={`${c.name}, ${c.craft ?? "craft"}`} className="ph" /></div>
                <div className="body">
                  <span className="name">{c.name} {c.nameHi && <span className="hindi" lang="hi">{c.nameHi}</span>}</span>
                  <span className="line">{c.craft ?? "Craft to be added"} · {c.state}</span>
                  {config.preview && c.status !== "published" && <span><span className="tag">{c.status.replace("_", " ")}</span></span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
