import Link from "next/link";

export default function ComingSoon({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <main className="section center" style={{ minHeight: 520, justifyContent: "center", gap: 20 }}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display h1">{title}</h1>
      <p className="lede" style={{ maxWidth: 560 }}>{body}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        <Link className="btn" href="/#map">Explore the map</Link>
        <Link className="ghost" href="/contact">Ask about a piece</Link>
      </div>
    </main>
  );
}
