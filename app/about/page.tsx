import type { Metadata } from "next";
import Link from "next/link";
import Photo from "@/components/Photo";
import { about, brand, countWord } from "@/lib/content";
import { listCities } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About", description: about.intro };

export default async function AboutPage() {
  const cities = await listCities();
  const photo = (cities.find((c) => c.slug === "khurja") ?? cities.find((c) => c.photo))?.photo ?? null;
  const n = cities.length;

  return (
    <main>
      <section className="split">
        <div className="split-copy">
          <p className="eyebrow">{about.eyebrow}</p>
          <h1 className="display" style={{ fontSize: "clamp(44px, 6vw, 64px)" }}>{about.title}</h1>
          <p className="hindi" lang="hi" style={{ margin: 0, fontSize: 22, color: "var(--muted)" }}>{brand.nameHi}</p>
          <p className="lede" style={{ maxWidth: 560 }}>{about.intro} {about.story}</p>
        </div>
        <div className="split-img"><Photo media={photo} alt="Hand-made Indian craft" /></div>
      </section>

      <section className="section" aria-labelledby="values-h">
        <h2 id="values-h" className="display h2s">What we stand for</h2>
        <div className="values">
          {about.values.map((v) => <div key={v.heading} className="value"><h3>{v.heading}</h3><p>{v.body}</p></div>)}
        </div>
      </section>

      <section className="section section-band" aria-labelledby="how-h">
        <h2 id="how-h" className="display h2s">How it works</h2>
        <div className="steps">
          {about.steps.map((s, i) => (
            <div key={s.heading} className="step"><span className="num">{i + 1}</span><h3>{s.heading}</h3><p>{s.body}</p></div>
          ))}
        </div>
      </section>

      <section className="section center" style={{ gap: 20 }}>
        <h2 className="display h2s">Start with a city</h2>
        <p className="lede" style={{ maxWidth: 560 }}>
          {n > 0 ? `${countWord(n)} ${n === 1 ? "city" : "cities"} so far, with more being added.` : "The first cities are being added."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <Link className="btn" href="/#map">Explore the map</Link>
          <Link className="ghost" href="/art">Browse all art</Link>
        </div>
      </section>
    </main>
  );
}
