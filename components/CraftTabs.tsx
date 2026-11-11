"use client";

import Link from "next/link";
import { addToBag } from "@/app/bag/actions";
import { dummyVariants } from "@/lib/content";
import type { CraftTab, Media } from "@/lib/site";
import Photo, { Credit, PermissionTag } from "./Photo";

function Film({ m }: { m: Media }) {
  return (
    <video src={m.src} poster={m.poster ?? undefined} controls preload="none" playsInline aria-label={m.alt || "Film of the craft"} />
  );
}

type Item = CraftTab & { productSlug: string; price: string; image: string | null; real: boolean };

export default function CraftTabs({ cityName, crafts, preview }: {
  cityName: string; crafts: Item[]; preview: boolean;
}) {
  if (!crafts.length) {
    return (
      <section id="story" className="band">
        <h2 className="display h2">The story</h2>
        <p className="lede">The craft of {cityName} is being researched. Its story will appear here soon.</p>
      </section>
    );
  }
  const cur = crafts[0];
  const variants = dummyVariants(cur.name, cur.productSlug);

  return (
    <>
      <section id="story" className="story">
        <div className="story-text">
          <h2 className="display h2">The story</h2>
          {cur.giTag && (
            <p style={{ fontSize: 15, color: "var(--muted)" }}>
              <span className="tag">GI tag{cur.giYear ? ` · ${cur.giYear}` : ""}</span>
            </p>
          )}
          {cur.paragraphs.length === 0 && (
            <p style={{ color: "var(--muted)" }}>The story of {cur.name.toLowerCase()} in {cityName} is being written and checked. It will appear here soon.</p>
          )}
          {cur.paragraphs.map((p, k) => (
            <p key={k} className={!p.checked ? "unchecked" : undefined}>
              {p.body}
              {preview && !p.checked && <> <span className="tag tag-warn">not checked</span></>}
            </p>
          ))}
          {cur.paragraphs.some((p) => p.sources.length) && (
            <details className="sources">
              <summary>Sources</summary>
              <ol>
                {[...new Map(cur.paragraphs.flatMap((p) => p.sources).map((s) => [s.title + (s.url ?? ""), s])).values()].map((s, k) => (
                  <li key={k}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> : s.title}</li>
                ))}
              </ol>
            </details>
          )}
        </div>
        <div className="film">
          {cur.film ? (
            <>
              <span className="kicker" style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "var(--madder)", fontWeight: 600 }}>Watch it being made</span>
              <Film m={cur.film} />
              {cur.film.alt && <span className="title">{cur.film.alt}</span>}
              <span className="meta"><Credit media={cur.film} /> <PermissionTag media={cur.film} /></span>
            </>
          ) : (
            <div className="photo-missing" style={{ minHeight: 360 }}>A film of the making will be added</div>
          )}
        </div>
      </section>

      {cur.videos.length > 0 && (
        <section className="band" aria-labelledby="more-films">
          <h2 id="more-films" className="display h2s">More from the workshops</h2>
          <div className="videos">
            {cur.videos.map((v) => (
              <figure key={v.id} className="vid" style={{ margin: 0 }}>
                <Film m={v} />
                <figcaption className="meta">
                  {v.alt && <>{v.alt}<br /></>}<Credit media={v} /> <PermissionTag media={v} />
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section id="shop" className="band" aria-labelledby="shop-h">
        <div className="shop-head">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 id="shop-h" className="display h2">Shop {cur.name}</h2>
            <p className="lede" style={{ margin: 0 }}>
              {cur.real
                ? `Pieces of ${cur.name.toLowerCase()} from ${cityName}, made by hand.`
                : "Preview of the future Shopify collection. Names, prices and photos below are placeholders."}
            </p>
          </div>
          <Link href="/art" className="shop-view-all">View the whole collection →</Link>
        </div>
        {cur.real ? (
          <div className="shop-grid single">
            <div className="card shop-card">
              <Link href={`/product/${cur.productSlug}`} aria-label={cur.name} className="img">
                {cur.image ? <img src={cur.image} alt={`${cur.name} from ${cityName}`} /> : <Photo media={cur.thumb} alt={`${cur.name} from ${cityName}`} />}
              </Link>
              <div className="body">
                <Link href={`/product/${cur.productSlug}`} className="nm">{cur.name}</Link>
                <span className="maker">Made by hand in {cityName}</span>
                <div className="buy">
                  <span className="price">{cur.price}</span>
                  <form action={addToBag}>
                    <input type="hidden" name="productSlug" value={cur.productSlug} />
                    <button type="submit" className="btn" style={{ padding: "10px 18px", fontSize: 14 }}>Add to bag</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="shop-grid">
            {variants.map((v) => (
              <div key={v.name} className="card shop-card">
                <Link href={`/product/${cur.productSlug}`} aria-label={v.name} className="img">
                  <Photo media={cur.thumb} alt="Placeholder product photo" />
                  <span className="tag">{v.tag}</span>
                </Link>
                <div className="body">
                  <Link href={`/product/${cur.productSlug}`} className="nm">{v.name}</Link>
                  <span className="maker">Workshop to be added</span>
                  <div className="buy">
                    <span className="price">{v.price}</span>
                    <Link href="/bag" className="btn" style={{ padding: "10px 18px", fontSize: 14 }}>Add to bag</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
