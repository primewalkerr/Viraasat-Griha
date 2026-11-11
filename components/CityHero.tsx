"use client";

import { useEffect, useRef, useState } from "react";
import type { Media } from "@/lib/site";
import { PermissionTag } from "./Photo";

export default function CityHero({ slides, eyebrow, name, nameHi, tagline }: {
  slides: Media[]; eyebrow: string; name: string; nameHi: string | null; tagline: string | null;
}) {
  const n = slides.length;
  const [a, setA] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!paused.current) setA((x) => (x + 1) % n); }, 6000);
    return () => clearInterval(t);
  }, [n]);

  const cur = slides[a];
  return (
    <section className="city-hero" aria-labelledby="city-h"
      onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}>
      {slides.map((s, i) => (
        <img key={s.id} src={s.src} alt={i === a ? s.alt : ""} aria-hidden={i !== a} className={"slide" + (i === a ? " on" : "")}
          loading={i === 0 ? "eager" : "lazy"} />
      ))}
      <div className="shade" />
      <div className="copy">
        <p className="hero-eyebrow">{eyebrow}</p>
        <h1 id="city-h">{name}</h1>
        {nameHi && <p className="hero-hi" lang="hi">{nameHi}</p>}
        {tagline && <p className="hero-tag">{tagline}</p>}
        <a href="#story" className="btn btn-light">Read the story</a>
      </div>
      {cur && (cur.creditName || !cur.cleared) && (
        <span className="credit-chip">{cur.creditName ? `Photo: ${cur.creditName} ` : ""}<PermissionTag media={cur} /></span>
      )}
      {n > 1 && (
        <div className="slide-ctl">
          <button type="button" className="arrow" aria-label="Previous photo" onClick={() => setA((a + n - 1) % n)}>‹</button>
          {slides.map((s, i) => (
            <button key={s.id} type="button" className="dot" aria-label={`Show photo ${i + 1}`} aria-current={i === a} onClick={() => setA(i)}><span /></button>
          ))}
          <button type="button" className="arrow" aria-label="Next photo" onClick={() => setA((a + 1) % n)}>›</button>
        </div>
      )}
    </section>
  );
}
