import "server-only";
import { config } from "./config";
import { dummyPrice, dummyPriceValue } from "./content";

const API_VERSION = "2025-01";

export type ShopifyProduct = {
  title: string;
  handle: string;
  amount: number;
  currency: string;
  price: string;      // formatted for display, e.g. "₹899"
  image: string | null;
  variantId: string | null;
};

async function storefrontFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  if (!config.shopifyReady) return null;
  try {
    const res = await fetch(`https://${config.shopifyDomain}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Shopify-Storefront-Private-Token": config.shopifyToken! },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) { console.error("Shopify Storefront API:", json.errors); return null; }
    return json.data as T;
  } catch (e) {
    console.error("Shopify Storefront API:", e);
    return null;
  }
}

function formatPrice(amount: string, currency: string): string {
  const n = Number(amount);
  return currency === "INR" ? `₹${n.toLocaleString("en-IN")}` : `${currency} ${n.toLocaleString("en-IN")}`;
}

type ProductNode = {
  title: string; handle: string;
  featuredImage: { url: string } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: { edges: { node: { id: string } }[] };
};

function toProduct(p: ProductNode): ShopifyProduct {
  const { amount, currencyCode } = p.priceRange.minVariantPrice;
  return {
    title: p.title, handle: p.handle, amount: Number(amount), currency: currencyCode, price: formatPrice(amount, currencyCode),
    image: p.featuredImage?.url ?? null, variantId: p.variants.edges[0]?.node.id ?? null,
  };
}

const PRODUCT_BY_HANDLE = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      title handle
      featuredImage { url }
      priceRange { minVariantPrice { amount currencyCode } }
      variants(first: 1) { edges { node { id } } }
    }
  }
`;

/** One real Shopify product, by its handle. Null if not ready, not found, or the API errors. */
export async function getShopifyProduct(handle: string): Promise<ShopifyProduct | null> {
  const data = await storefrontFetch<{ productByHandle: ProductNode | null }>(PRODUCT_BY_HANDLE, { handle });
  return data?.productByHandle ? toProduct(data.productByHandle) : null;
}

const PRODUCTS_BY_HANDLES = `
  query ProductsByHandles($query: String!) {
    products(first: 50, query: $query) {
      edges { node {
        title handle
        featuredImage { url }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 1) { edges { node { id } } }
      } }
    }
  }
`;

/** Real Shopify products matching any of these handles, in one request. Missing handles are just absent from the map. */
async function getShopifyProducts(handles: string[]): Promise<Map<string, ShopifyProduct>> {
  const out = new Map<string, ShopifyProduct>();
  if (!config.shopifyReady || handles.length === 0) return out;
  const query = handles.map((h) => `handle:'${h}'`).join(" OR ");
  const data = await storefrontFetch<{ products: { edges: { node: ProductNode }[] } }>(PRODUCTS_BY_HANDLES, { query });
  for (const edge of data?.products.edges ?? []) {
    const product = toProduct(edge.node);
    out.set(product.handle, product);
  }
  return out;
}

const COLLECTION_PRODUCTS = `
  query CollectionProducts($handle: String!) {
    collectionByHandle(handle: $handle) {
      products(first: 50) { edges { node {
        title handle
        featuredImage { url }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 1) { edges { node { id } } }
      } } }
    }
  }
`;

/** Every real Shopify product in a craft's collection (its `shop_collections.shopify_handle`). */
export async function getCollectionProducts(handle: string): Promise<ShopifyProduct[]> {
  const data = await storefrontFetch<{ collectionByHandle: { products: { edges: { node: ProductNode }[] } } | null }>(
    COLLECTION_PRODUCTS, { handle },
  );
  return (data?.collectionByHandle?.products.edges ?? []).map((e) => toProduct(e.node));
}

/** `linkSlug` is what a card should actually link to (and, for a cart action, which handle to add) —
 *  the real item's own handle when it's the only one, otherwise the craft's overview slug. */
export type ResolvedPrice = { price: string; value: number; image: string | null; variantId: string | null; real: boolean; linkSlug: string };

/**
 * A representative price/photo for each craft card on a listing grid: the cheapest real product
 * in its live Shopify collection when one has products, the single derived-handle match or dummy
 * placeholder otherwise. When a collection has exactly one real item, `linkSlug` points straight at
 * that item's own handle (skipping the craft overview page); with zero or several items it points
 * at the craft's own slug instead, since there's either nothing real to link to yet or a choice to make.
 */
export async function resolveCardPrices(
  cards: { productSlug: string; shopLive: boolean; collectionHandle: string | null }[],
): Promise<Map<string, ResolvedPrice>> {
  const withCollection = cards.filter((c) => c.shopLive && c.collectionHandle);
  const collectionResults = await Promise.all(withCollection.map((c) => getCollectionProducts(c.collectionHandle!)));

  const out = new Map<string, ResolvedPrice>();
  const remaining: string[] = [];
  withCollection.forEach((c, i) => {
    const items = collectionResults[i];
    const cheapest = items.length ? items.reduce((a, b) => (b.amount < a.amount ? b : a)) : null;
    if (cheapest) {
      out.set(c.productSlug, {
        price: cheapest.price, value: cheapest.amount, image: cheapest.image, variantId: cheapest.variantId, real: true,
        linkSlug: items.length === 1 ? items[0].handle : c.productSlug,
      });
    } else remaining.push(c.productSlug);
  });
  for (const c of cards) if (!(c.shopLive && c.collectionHandle)) remaining.push(c.productSlug);

  const fallback = await resolvePrices(remaining);
  for (const slug of remaining) out.set(slug, { ...fallback.get(slug)!, linkSlug: slug });
  return out;
}

/**
 * A price (and photo) for each product slug: the real Shopify listing when its handle matches,
 * the placeholder dummy price otherwise. Craft/city product slugs only become "real" once a
 * Shopify product's handle is set to match that same slug.
 */
export async function resolvePrices(productSlugs: string[]): Promise<Map<string, ResolvedPrice>> {
  const real = await getShopifyProducts(productSlugs);
  const out = new Map<string, ResolvedPrice>();
  for (const slug of productSlugs) {
    const p = real.get(slug);
    out.set(slug, p
      ? { price: p.price, value: p.amount, image: p.image, variantId: p.variantId, real: true, linkSlug: slug }
      : { price: dummyPrice(slug), value: dummyPriceValue(slug), image: null, variantId: null, real: false, linkSlug: slug });
  }
  return out;
}

/* --------------------------------------------------------------------- cart */

export type CartLine = {
  id: string; quantity: number; title: string; variantTitle: string | null;
  handle: string; image: string | null; price: string; lineTotal: string;
};

export type Cart = { id: string; checkoutUrl: string; totalQuantity: number; subtotal: string; total: string; lines: CartLine[] };

type CartNode = {
  id: string; checkoutUrl: string; totalQuantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string }; totalAmount: { amount: string; currencyCode: string } };
  lines: { edges: { node: {
    id: string; quantity: number;
    merchandise: { id: string; title: string; image: { url: string } | null; product: { title: string; handle: string }; price: { amount: string; currencyCode: string } };
  } }[] };
};

function toCart(c: CartNode): Cart {
  return {
    id: c.id, checkoutUrl: c.checkoutUrl, totalQuantity: c.totalQuantity,
    subtotal: formatPrice(c.cost.subtotalAmount.amount, c.cost.subtotalAmount.currencyCode),
    total: formatPrice(c.cost.totalAmount.amount, c.cost.totalAmount.currencyCode),
    lines: c.lines.edges.map(({ node: l }) => ({
      id: l.id, quantity: l.quantity, title: l.merchandise.product.title,
      variantTitle: l.merchandise.title === "Default Title" ? null : l.merchandise.title,
      handle: l.merchandise.product.handle, image: l.merchandise.image?.url ?? null,
      price: formatPrice(l.merchandise.price.amount, l.merchandise.price.currencyCode),
      lineTotal: formatPrice(String(Number(l.merchandise.price.amount) * l.quantity), l.merchandise.price.currencyCode),
    })),
  };
}

const CART_FIELDS = `
  id checkoutUrl totalQuantity
  cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
  lines(first: 50) { edges { node {
    id quantity
    merchandise { ... on ProductVariant {
      id title image { url } product { title handle } price { amount currencyCode }
    } }
  } } }
`;

export async function createCart(variantId: string, quantity = 1): Promise<Cart | null> {
  const data = await storefrontFetch<{ cartCreate: { cart: CartNode | null; userErrors: { message: string }[] } }>(
    `mutation CartCreate($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { ${CART_FIELDS} } userErrors { field message } } }`,
    { lines: [{ merchandiseId: variantId, quantity }] },
  );
  if (data?.cartCreate.userErrors.length) console.error("Shopify cartCreate:", data.cartCreate.userErrors);
  return data?.cartCreate.cart ? toCart(data.cartCreate.cart) : null;
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefrontFetch<{ cart: CartNode | null }>(`query CartGet($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`, { id: cartId });
  return data?.cart ? toCart(data.cart) : null;
}

export async function addCartLine(cartId: string, variantId: string, quantity = 1): Promise<Cart | null> {
  const data = await storefrontFetch<{ cartLinesAdd: { cart: CartNode | null; userErrors: { message: string }[] } }>(
    `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { field message } } }`,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] },
  );
  if (data?.cartLinesAdd.userErrors.length) console.error("Shopify cartLinesAdd:", data.cartLinesAdd.userErrors);
  return data?.cartLinesAdd.cart ? toCart(data.cartLinesAdd.cart) : null;
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart | null> {
  const data = await storefrontFetch<{ cartLinesUpdate: { cart: CartNode | null; userErrors: { message: string }[] } }>(
    `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { field message } } }`,
    { cartId, lines: [{ id: lineId, quantity }] },
  );
  if (data?.cartLinesUpdate.userErrors.length) console.error("Shopify cartLinesUpdate:", data.cartLinesUpdate.userErrors);
  return data?.cartLinesUpdate.cart ? toCart(data.cartLinesUpdate.cart) : null;
}

export async function removeCartLine(cartId: string, lineId: string): Promise<Cart | null> {
  const data = await storefrontFetch<{ cartLinesRemove: { cart: CartNode | null; userErrors: { message: string }[] } }>(
    `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } userErrors { field message } } }`,
    { cartId, lineIds: [lineId] },
  );
  if (data?.cartLinesRemove.userErrors.length) console.error("Shopify cartLinesRemove:", data.cartLinesRemove.userErrors);
  return data?.cartLinesRemove.cart ? toCart(data.cartLinesRemove.cart) : null;
}
