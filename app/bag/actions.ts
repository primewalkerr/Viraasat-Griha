"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addCartLine, createCart, getShopifyProduct, removeCartLine, updateCartLine } from "@/lib/shopify";

const COOKIE = "vg_cart_id";

async function getCartId(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

async function setCartId(id: string) {
  (await cookies()).set(COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

/** Adds one of a craft's real Shopify variant to the bag, creating the cart if this is the first item. */
export async function addToBag(formData: FormData) {
  const productSlug = String(formData.get("productSlug") ?? "");
  const product = productSlug ? await getShopifyProduct(productSlug) : null;
  if (product?.variantId) {
    const cartId = await getCartId();
    const cart = cartId ? await addCartLine(cartId, product.variantId, 1) : null;
    const resolved = cart ?? (await createCart(product.variantId, 1));
    if (resolved && resolved.id !== cartId) await setCartId(resolved.id);
  }
  revalidatePath("/", "layout"); // the header's bag-count badge lives in the root layout
  redirect("/bag");
}

export async function updateBagLine(formData: FormData) {
  const lineId = String(formData.get("lineId") ?? "");
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));
  const cartId = await getCartId();
  if (cartId && lineId) await updateCartLine(cartId, lineId, quantity);
  revalidatePath("/", "layout");
  redirect("/bag");
}

export async function removeBagLine(formData: FormData) {
  const lineId = String(formData.get("lineId") ?? "");
  const cartId = await getCartId();
  if (cartId && lineId) await removeCartLine(cartId, lineId);
  revalidatePath("/", "layout");
  redirect("/bag");
}
