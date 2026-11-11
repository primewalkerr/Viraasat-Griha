import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getCart } from "@/lib/shopify";
import { removeBagLine, updateBagLine } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bag" };

export default async function BagPage() {
  const cartId = (await cookies()).get("vg_cart_id")?.value;
  const cart = cartId ? await getCart(cartId) : null;
  const lines = cart?.lines ?? [];
  const empty = lines.length === 0;

  return (
    <main className="main">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <h1 className="display h1">Your bag</h1>
        {!empty && (
          <span style={{ fontSize: 16, color: "var(--muted)" }}>
            {cart!.totalQuantity} {cart!.totalQuantity === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {empty ? (
        <div className="bag-empty">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
          </svg>
          <h2 className="display h2s">Your bag is empty</h2>
          <p className="lede" style={{ maxWidth: 420, textAlign: "center" }}>Every piece comes from a craft city and a pair of hands. Find one to bring home.</p>
          <Link className="btn" href="/art">Browse all art</Link>
        </div>
      ) : (
        <div className="bag-layout">
          <section className="bag-lines">
            {lines.map((l) => (
              <div key={l.id} className="bag-line">
                {l.image ? <img src={l.image} alt={l.title} /> : <div className="photo-missing" style={{ width: 112, height: 112, flex: "0 0 112px" }} />}
                <div className="info">
                  <span className="nm">{l.title}</span>
                  {l.variantTitle && <span className="sub">{l.variantTitle}</span>}
                </div>
                <div className="qty">
                  <form action={updateBagLine}>
                    <input type="hidden" name="lineId" value={l.id} />
                    <input type="hidden" name="quantity" value={l.quantity - 1} />
                    <button type="submit" aria-label="Fewer" disabled={l.quantity <= 1}>−</button>
                  </form>
                  <span>{l.quantity}</span>
                  <form action={updateBagLine}>
                    <input type="hidden" name="lineId" value={l.id} />
                    <input type="hidden" name="quantity" value={l.quantity + 1} />
                    <button type="submit" aria-label="More">+</button>
                  </form>
                </div>
                <span className="line-total">{l.lineTotal}</span>
                <form action={removeBagLine}>
                  <input type="hidden" name="lineId" value={l.id} />
                  <button type="submit" className="link-btn">Remove</button>
                </form>
              </div>
            ))}
            <Link href="/art" className="back-shopping">← Continue shopping</Link>
          </section>

          <aside className="bag-summary">
            <h2 className="display h2s">Order summary</h2>
            <div className="row"><span>Subtotal ({cart!.totalQuantity} {cart!.totalQuantity === 1 ? "item" : "items"})</span><span>{cart!.subtotal}</span></div>
            <div className="row"><span>Shipping</span><span>At checkout</span></div>
            <div className="row"><span>Taxes (GST)</span><span>Included</span></div>
            <div className="row total"><span>Total</span><span>{cart!.total}</span></div>
            <a className="btn" href={cart!.checkoutUrl}>Proceed to checkout</a>
            <span className="note">Shipping is added at checkout. You can check out as a guest, no account needed.</span>
          </aside>
        </div>
      )}
    </main>
  );
}
