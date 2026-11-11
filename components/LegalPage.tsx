import type { LegalDoc } from "@/lib/legal";

export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className="main">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="eyebrow">Viraasat Griha</p>
        <h1 className="display h1">{doc.title}</h1>
        <p className="lede">{doc.summary} Last updated {doc.updated}.</p>
      </div>
      <p className="notice">Draft wording. Items in [brackets] are to be filled in, and the full text should be reviewed by a lawyer before launch.</p>
      <div className="legal">
        <nav className="toc" aria-label="On this page">
          <span>On this page</span>
          {doc.sections.map((s, i) => <a key={s.heading} href={`#s${i + 1}`}>{i + 1}. {s.heading}</a>)}
        </nav>
        <div className="legal-body">
          {doc.sections.map((s, i) => (
            <section key={s.heading} id={`s${i + 1}`}>
              <h2>{i + 1}. {s.heading}</h2>
              <p>{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
