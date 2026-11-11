"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ArtCard } from "@/lib/site";
import Photo from "./Photo";

const W = 280, G = 72, EASE = "1.2s cubic-bezier(.65,0,.35,1)", TICK_MS = 3600, SNAP_DELAY = 1300;

type Item = ArtCard & { price: string; image: string | null };

/** "Best of Indian art": a slow carousel with prev/next arrows; a plain swipe row on phones or with reduced motion. */
export default function BestStrip({ items }: { items: Item[] }) {
  const n = items.length;
  const [animate, setAnimate] = useState(true);
  const [pos, setPos] = useState(n);
  const [snap, setSnap] = useState(false);
  const paused = useRef(false);
  const snapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tickTimer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 600px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimate(n >= 3 && !narrow.matches && !calm.matches);
    update();
    narrow.addEventListener("change", update);
    return () => narrow.removeEventListener("change", update);
  }, [n]);

  // Three copies make the loop seamless; stepping past either end snaps (no animation) to the same item in the middle copy.
  const step = useCallback((delta: number) => {
    clearTimeout(snapTimer.current);
    setSnap(false);
    setPos((p) => {
      const next = p + delta;
      if (next >= 2 * n) snapTimer.current = setTimeout(() => { setSnap(true); setPos(n); }, SNAP_DELAY);
      else if (next < n) snapTimer.current = setTimeout(() => { setSnap(true); setPos(2 * n - 1); }, SNAP_DELAY);
      return next;
    });
  }, [n]);

  useEffect(() => {
    if (!animate) return;
    // setInterval's first tick only fires after the full delay, which made the
    // strip sit still for TICK_MS before ever moving; fire the first step
    // quickly instead, then settle into the normal cadence.
    const first = setTimeout(() => { if (!paused.current) step(1); }, 500);
    tickTimer.current = setInterval(() => { if (!paused.current) step(1); }, TICK_MS);
    return () => { clearTimeout(first); clearInterval(tickTimer.current); clearTimeout(snapTimer.current); };
  }, [animate, step]);

  // A manual click restarts the auto-advance timer so it doesn't fire right behind the click.
  const manualStep = (delta: number) => {
    step(delta);
    clearInterval(tickTimer.current);
    tickTimer.current = setInterval(() => { if (!paused.current) step(1); }, TICK_MS);
  };

  const card = (c: Item, key: string, style?: React.CSSProperties, hidden = false) => (
    <Link key={key} href={`/product/${c.productSlug}`} className="best-card" style={style} aria-hidden={hidden || undefined} tabIndex={hidden ? -1 : undefined}>
      <div className="img">
        {c.image ? <img src={c.image} alt={`${c.craft} from ${c.city}`} /> : <Photo media={c.photo} alt={`${c.craft} from ${c.city}`} />}
      </div>
      <div className="body">
        <span className="craft">{c.craft}</span>
        <span className="place">{c.city} · {c.state}</span>
        <span className="price">{c.price}</span>
      </div>
    </Link>
  );

  if (!animate) {
    return <div className="best-viewport"><div className="best-track static">{items.map((c) => card(c, c.productSlug))}</div></div>;
  }

  // Three copies make the loop seamless; only the middle copy is reachable by keyboard and screen readers.
  const loop = [...items, ...items, ...items];
  return (
    <div className="best-viewport" onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)} onBlur={() => (paused.current = false)}>
      <button type="button" aria-label="Previous art" className="best-arrow prev" onClick={() => manualStep(-1)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <button type="button" aria-label="Next art" className="best-arrow next" onClick={() => manualStep(1)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
      </button>
      <div className="best-track" style={{ transform: `translateX(${-(pos * (W + G) + W / 2)}px)`, transition: snap ? "none" : `transform ${EASE}` }}>
        {loop.map((c, i) => {
          const on = i === pos;
          return card(c, `${c.productSlug}-${i}`, {
            transform: `scale(${on ? 1.14 : 0.94})`, opacity: on ? 1 : 0.62, zIndex: on ? 2 : 1,
            borderColor: on ? "var(--madder)" : undefined, boxShadow: on ? "0 22px 44px rgba(36,31,26,.22)" : "none",
            transition: snap ? "none" : `transform ${EASE}, opacity ${EASE}, box-shadow ${EASE}`,
          }, i < n || i >= 2 * n);
        })}
      </div>
    </div>
  );
}
