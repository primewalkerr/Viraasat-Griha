import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { support } from "@/lib/content";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  const details = [
    ["Email", support.email],
    ["Phone and WhatsApp", support.phone],
    ["Hours", support.hours],
    ["Address", support.address],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <main className="main" style={{ gap: 48 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="eyebrow">Contact us</p>
        <h1 className="display h1">We would love to hear from you</h1>
        <p className="lede">
          Questions about a craft, an order or working with us? Write to us and a real person will reply. Answers about delivery
          and returns are on the <Link href="/shipping">shipping and returns</Link> page.
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-start" }}>
        <ContactForm />
        <aside className="contact-aside" aria-label="Other ways to reach us">
          {details.map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="k">{k}</span>
              <span className="v">{k === "Email" ? <a href={`mailto:${v}`}>{v}</a> : v}</span>
            </div>
          ))}
          <div style={{ paddingTop: details.length ? 20 : 0, borderTop: details.length ? "1px solid var(--line)" : 0, fontSize: 15, lineHeight: 1.6, color: "var(--muted)" }}>
            We reply by email{support.replyTime ? ` within ${support.replyTime}` : ""}. For order questions please include your order number.
          </div>
        </aside>
      </div>
    </main>
  );
}
