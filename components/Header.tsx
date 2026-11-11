import Link from "next/link";
import { cookies } from "next/headers";
import { brand } from "@/lib/content";
import { getCart } from "@/lib/shopify";
import { readSession } from "@/lib/customer-session";
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from "./Icons";

export default async function Header() {
  const cartId = (await cookies()).get("vg_cart_id")?.value;
  const cart = cartId ? await getCart(cartId) : null;
  const count = cart?.totalQuantity ?? 0;
  const loggedIn = Boolean(await readSession());

  return (
    <header className="site-header">
      <Link href="/" className="logo" aria-label="Viraasat Griha, home">
        <span className="logo-en">{brand.name}</span>
        <span className="logo-hi" lang="hi">{brand.nameHi}</span>
      </Link>
      <nav className="nav-icons" aria-label="Search, wishlist, bag and account">
        <Link href="/search"><SearchIcon /><span>Search</span></Link>
        <Link href="/wishlist"><HeartIcon /><span>Wishlist</span></Link>
        <Link href="/bag"><BagIcon />{count > 0 && <span className="bag-count">{count}</span>}<span>Bag</span></Link>
        <Link href={loggedIn ? "/account" : "/login"}><UserIcon /><span>{loggedIn ? "Account" : "Log in"}</span></Link>
      </nav>
    </header>
  );
}
