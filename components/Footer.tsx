import Link from "next/link";
import { brand } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-cols">
        <div className="footer-brand">
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.svg" alt="" width={44} height={44} />
            <span className="logo-text">
              <span className="logo-en" style={{ fontSize: 34 }}>{brand.name}</span>
              <span className="hindi" lang="hi" style={{ fontSize: 15, color: "var(--muted)" }}>{brand.nameHi}</span>
            </span>
          </span>
          <p className="lede" style={{ fontSize: 16, maxWidth: 380 }}>{brand.footerBlurb}</p>
        </div>
        <nav className="footer-col" aria-labelledby="f-explore">
          <h2 id="f-explore">Explore</h2>
          <Link href="/#map">Map of crafts</Link>
          <Link href="/#cities">Cities</Link>
          <Link href="/art">All art</Link>
        </nav>
        <nav className="footer-col" aria-labelledby="f-account">
          <h2 id="f-account">My account</h2>
          <Link href="/login">Log in</Link>
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/bag">Bag</Link>
        </nav>
        <nav className="footer-col" aria-labelledby="f-help">
          <h2 id="f-help">Help</h2>
          <Link href="/shipping">Shipping and returns</Link>
          <Link href="/contact">Contact us</Link>
          <Link href="/about">About Viraasat</Link>
        </nav>
      </div>
      <div className="footer-base">
        <span>© Viraasat Griha. All rights reserved.</span>
        <span>{brand.madeIn} · <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></span>
      </div>
    </footer>
  );
}
