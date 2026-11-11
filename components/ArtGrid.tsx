"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ArtCard } from "@/lib/site";
import { Caret, FilterIcon } from "./Icons";
import Photo from "./Photo";

const SORTS = [
  ["featured", "Featured"],
  ["az", "Craft: A to Z"],
  ["za", "Craft: Z to A"],
  ["state", "State"],
] as const;
type Sort = (typeof SORTS)[number][0];

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const uniq = (a: string[]) => [...new Set(a)];

type Item = ArtCard & { price: string; value: number; image: string | null };

export default function ArtGrid({ items, soonLabel }: { items: Item[]; soonLabel: string }) {
  const [crafts, setCrafts] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const clearAll = () => { setCrafts([]); setStates([]); setMinPrice(""); setMaxPrice(""); };

  // Close menus on outside click or Escape.
  useEffect(() => {
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) {
        setFilterOpen(false); setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, []);

  const craftNames = uniq(items.map((x) => x.craft)).sort();
  const stateNames = uniq(items.map((x) => x.state)).sort();
  const min = minPrice ? Number(minPrice) : null;
  const max = maxPrice ? Number(maxPrice) : null;
  const list = items
    .filter((x) => (!crafts.length || crafts.includes(x.craft)) && (!states.length || states.includes(x.state)))
    .filter((x) => (min == null || x.value >= min) && (max == null || x.value <= max))
    .sort((a, b) =>
      sort === "az" ? a.craft.localeCompare(b.craft)
        : sort === "za" ? b.craft.localeCompare(a.craft)
          : sort === "state" ? a.state.localeCompare(b.state) || a.order - b.order
            : a.order - b.order);
  const active = crafts.length + states.length + (min != null || max != null ? 1 : 0);

  return (
    <>
      <div className="toolbar" ref={root}>
        <div className="dd">
          <button type="button" className="dd-btn" aria-haspopup="dialog" aria-expanded={filterOpen}
            onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false); }}>
            <FilterIcon /><span>Filter</span>{active > 0 && <span className="badge">{active}</span>}<Caret />
          </button>
          {filterOpen && (
            <div className="dd-panel" role="dialog" aria-label="Filters">
              <span className="label">Craft</span>
              <div className="chips">
                {craftNames.map((n) => (
                  <button key={n} type="button" className="chip" aria-pressed={crafts.includes(n)} onClick={() => setCrafts(toggle(crafts, n))}>{n}</button>
                ))}
              </div>
              <span className="label">State</span>
              <div className="chips">
                {stateNames.map((n) => (
                  <button key={n} type="button" className="chip" aria-pressed={states.includes(n)} onClick={() => setStates(toggle(states, n))}>{n}</button>
                ))}
              </div>
              <span className="label">Price range</span>
              <div className="price-range">
                <span>₹</span>
                <input type="number" min={0} inputMode="numeric" placeholder="Min" value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)} aria-label="Minimum price" />
                <span>to</span>
                <input type="number" min={0} inputMode="numeric" placeholder="Max" value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)} aria-label="Maximum price" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginTop: 4 }}>
                <button type="button" className="link-btn" onClick={clearAll}>Clear all</button>
                <button type="button" className="btn" style={{ minHeight: 44, padding: "0 24px", fontSize: 15 }} onClick={() => setFilterOpen(false)}>Show results</button>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 14, color: "var(--muted)" }} aria-live="polite">
            Showing {list.length} of {items.length}
          </span>
          <div className="dd">
            <button type="button" className="dd-btn" style={{ minWidth: 240 }} aria-haspopup="listbox" aria-expanded={sortOpen}
              onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false); }}>
              <span><span style={{ fontWeight: 500, color: "var(--muted)" }}>Sort by: </span>{SORTS.find((s) => s[0] === sort)![1]}</span><Caret />
            </button>
            {sortOpen && (
              <ul className="sort-menu" role="listbox" aria-label="Sort by">
                {SORTS.map(([k, label]) => (
                  <li key={k} role="none">
                    <button type="button" role="option" aria-selected={sort === k} aria-checked={sort === k}
                      onClick={() => { setSort(k); setSortOpen(false); }}>{label}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <span className="display" style={{ fontSize: 34 }}>Nothing matches these filters</span>
          <button type="button" className="btn" onClick={clearAll}>Clear filters</button>
        </div>
      ) : (
        <div className="art-grid">
          {list.map((a) => (
            <Link key={a.key} href={`/product/${a.productSlug}`} className="card art-card">
              <div className="img">
                {a.image ? <img src={a.image} alt={`${a.craft} from ${a.city}`} className="ph" /> : <Photo media={a.photo} alt={`${a.craft} from ${a.city}`} className="ph" />}
                {!a.shopLive && <span className="tag soon">{soonLabel}</span>}
              </div>
              <div className="body">
                <span className="craft">{a.craft}</span>
                <span className="place">{a.city} · {a.state}</span>
                <span className="price">{a.price}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
