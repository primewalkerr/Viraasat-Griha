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

/**
 * Adds a Shopify variant to the bag, creating the cart if this is the first item.
 * Pass `variantId` + `quantity` directly (the product detail page, which knows which
 * variant is selected); simpler callers can pass just `productSlug` and get that
 * product's first variant at quantity 1, as before.
 */
export async function addToBag(formData: FormData) {
  const productSlug = String(formData.get("productSlug") ?? "");
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));
  let variantId = String(formData.get("variantId") ?? "");
  if (!variantId) {
    const product = productSlug ? await getShopifyProduct(productSlug) : null;
    variantId = product?.variantId ?? "";
  }
  if (variantId) {
    const cartId = await getCartId();
    const cart = cartId ? await addCartLine(cartId, variantId, quantity) : null;
    const resolved = cart ?? (await createCart(variantId, quantity));
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
