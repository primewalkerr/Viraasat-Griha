"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CityCard } from "@/lib/site";
import { SearchIcon } from "./Icons";
import Photo from "./Photo";

export default function SearchBox({ cities, popular, initial }: { cities: CityCard[]; popular: string[]; initial: string }) {
  const [q, setQ] = useState(initial);

  // Keep ?q= in the address bar so a search can be shared or reloaded.
  useEffect(() => {
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      if (q.trim()) url.searchParams.set("q", q.trim()); else url.searchParams.delete("q");
      window.history.replaceState(null, "", url);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = cities.filter((c) => words.every((w) => c.searchText.includes(w)));
  const summary = !words.length
    ? `Showing all ${cities.length} ${cities.length === 1 ? "city" : "cities"}`
    : `${results.length} ${results.length === 1 ? "result" : "results"} for “${q.trim()}”`;

  return (
    <>
      <div className="search-box">
        <SearchIcon />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try Bidriware, Jaipur or silk"
          aria-label="Search crafts, cities and states" autoComplete="off" />
        {q && <button type="button" className="clear" aria-label="Clear search" onClick={() => setQ("")}>✕</button>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)", marginRight: 6 }}>Popular</span>
        {popular.map((p) => (
          <button key={p} type="button" className="chip" aria-pressed={q.toLowerCase() === p.toLowerCase()} onClick={() => setQ(p)}>{p}</button>
        ))}
      </div>
      <div style={{ paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 15, color: "var(--muted)" }} aria-live="polite">{summary}</div>
      {results.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {results.map((r) => (
            <Link key={r.slug} href={`/city/${r.slug}`} className="card result">
              <Photo media={r.photo} alt={`${r.craft ?? "Craft"} from ${r.name}`} label="" />
              <span className="txt">
                <span className="st">{r.state}</span>
                <span className="craft">{r.craft ?? "Craft to be added"}</span>
                <span style={{ fontSize: 16, color: "var(--muted)" }}>{r.name} {r.nameHi && <span className="hindi" lang="hi" style={{ fontSize: 14 }}>{r.nameHi}</span>}</span>
              </span>
              <span className="go">View →</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">
          <span className="display" style={{ fontSize: 34 }}>No matches for “{q.trim()}”</span>
          <span style={{ fontSize: 17, lineHeight: 1.6, color: "var(--muted)", maxWidth: 520 }}>Check the spelling, or try a craft, a city or a state. You can also browse everything.</span>
          <Link className="btn" href="/art">Browse all art</Link>
        </div>
      )}
    </>
  );
}
