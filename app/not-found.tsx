import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section center" style={{ minHeight: 520, justifyContent: "center", gap: 20 }}>
      <p className="eyebrow">Page not found</p>
      <h1 className="display h1">This page has wandered off the map</h1>
      <p className="lede" style={{ maxWidth: 520 }}>The city or page you were looking for is not here, or is not published yet.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        <Link className="btn" href="/#map">Explore the map</Link>
        <Link className="ghost" href="/search">Search</Link>
      </div>
    </main>
  );
}
