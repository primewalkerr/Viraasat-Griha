"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CityCard } from "@/lib/site";
import { home } from "@/lib/content";
import Photo from "./Photo";

/** Stylised outline of India on a 640 x 700 frame (the design's drawing). */
const INDIA =
  "140,35 200,60 250,86 236,130 264,167 280,181 262,211 340,240 422,260 436,231 500,233 550,200 580,220 606,225 584,251 560,273 552,304 528,335 510,357 500,321 484,313 466,291 450,273 438,291 426,304 438,330 440,361 400,372 388,401 360,420 320,460 286,489 264,504 264,550 258,585 256,618 238,640 222,660 210,667 190,647 178,603 156,561 136,504 120,453 116,427 112,383 100,379 70,385 40,357 64,343 30,330 24,324 50,308 70,277 60,240 98,229 120,196 150,163 156,130 144,86";

const Land = () => (
  <g transform="translate(336 0)">
    <polygon points={INDIA} fill="none" stroke="#7E97AB" strokeWidth="22" strokeLinejoin="round" opacity=".16" />
    <polygon points={INDIA} fill="#F3E8CB" stroke="#7A5C2E" strokeWidth="2" strokeLinejoin="round" />
  </g>
);

const subline = (c: CityCard) => `${c.craft ?? "Craft to be added"} · ${c.state}`;

export default function CraftMap({ cities }: { cities: CityCard[] }) {
  const pins = cities.filter((c) => c.mapX != null && c.mapY != null);
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (pins.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!paused.current) setActive((a) => (a + 1) % pins.length); }, 5000);
    return () => clearInterval(t);
  }, [pins.length]);

  if (!pins.length) return null;
  const sel = pins[active % pins.length];
  const hold = () => { paused.current = true; };
  const release = () => { paused.current = false; };

  return (
    <section id="map" className="map-sec" aria-labelledby="map-h">
      <div className="map-head">
        <h2 id="map-h" className="display h2">{home.mapHeading}</h2>
        <span className="hindi" lang="hi" style={{ fontSize: 16, color: "var(--muted)" }}>{home.mapHeadingHi}</span>
      </div>
      <div className="map-box" onMouseEnter={hold} onMouseLeave={release} onFocus={hold} onBlur={release}>
        <svg className="map-wide" viewBox="0 0 1312 700" aria-hidden="true">
          <rect x="10" y="10" width="1292" height="680" fill="none" stroke="#7A5C2E" strokeWidth="2" />
          <rect x="16" y="16" width="1280" height="668" fill="none" stroke="#B79B63" strokeWidth="1" />
          <g fill="none" stroke="#B79B63" strokeWidth="1" opacity=".7">
            <path d="M16 96H1296M16 360H1296M16 640H1296" />
            <path d="M164 16V684M328 16V684M492 16V684M656 16V684M820 16V684M984 16V684M1148 16V684" />
          </g>
          <Land />
          <g fontFamily="Cormorant Garamond, Georgia, serif" fontStyle="italic" fontSize="20" fill="#5E564C" opacity=".9" textAnchor="middle">
            <text x="806" y="450">Bay of Bengal</text>
            <text x="406" y="560">Arabian Sea</text>
          </g>
          <g transform="translate(1190 580)" stroke="#7A5C2E" fill="#7A5C2E">
            <circle r="34" fill="none" strokeWidth="1.5" />
            <path d="M0 -44L8 -8L44 0L8 8L0 44L-8 8L-44 0L-8 -8Z" fillOpacity=".85" />
            <path d="M0 -24L5 -5L24 0L5 5L0 24L-5 5L-24 0L-5 -5Z" fill="#F3E8CB" stroke="none" transform="rotate(45)" />
            <text x="0" y="-52" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="16" stroke="none">N</text>
          </g>
        </svg>
        <svg className="map-compact" viewBox="340 10 620 680" aria-hidden="true">
          <g fill="none" stroke="#B79B63" strokeWidth="1.5" opacity=".6">
            <path d="M340 96H960M340 360H960M340 640H960" /><path d="M492 10V690M656 10V690M820 10V690" />
          </g>
          <Land />
        </svg>
        <div className="cartouche">{home.cartouche} <span className="hindi" lang="hi">{home.cartoucheHi}</span></div>
        <p className="map-note">{home.mapDisclaimer}</p>

        {pins.map((c, i) => (
          <button
            key={c.slug}
            type="button"
            className="pin"
            aria-pressed={i === active % pins.length}
            aria-label={`${c.pin}. ${c.name}, ${c.craft ?? "craft to be added"}`}
            onClick={() => setActive(i)}
            style={{
              ["--x" as string]: ((c.mapX! + 336) / 1312) * 100,
              ["--y" as string]: (c.mapY! / 700) * 100,
              ["--cx" as string]: ((c.mapX! + 336 - 340) / 620) * 100,
              ["--cy" as string]: ((c.mapY! - 10) / 680) * 100,
            }}
          >
            {c.pin}
          </button>
        ))}

        {pins.map((c, i) => (
          <Link key={c.slug} href={`/city/${c.slug}`} className={"pin-card" + (i === active % pins.length ? " on" : "")}
            aria-hidden={i !== active % pins.length} tabIndex={i === active % pins.length ? 0 : -1}>
            <Photo media={c.photo} alt={`${c.name}, ${c.craft ?? ""}`} />
            <span className="name">{c.name}</span>
            <span className="sub">{subline(c)}</span>
            <span className="view">View city →</span>
          </Link>
        ))}
      </div>

      <Link href={`/city/${sel.slug}`} className="sel-card">
        <Photo media={sel.photo} alt={`${sel.name} photo`} label="" />
        <span className="txt">
          <span className="name">{sel.name}</span>
          <span className="sub">{subline(sel)}</span>
          <span className="view">View city →</span>
        </span>
      </Link>
    </section>
  );
}
