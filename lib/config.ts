/** Settings from .env.local (see .env.example). */
export const config = {
  /** Turso (libSQL) connection: the same database the admin's tools write to.
   *  Media files (photos/videos) also live there, in the media_files table. */
  tursoUrl: process.env.TURSO_DATABASE_URL || "",
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN || "",
  /** Preview shows drafts, unchecked text and media without permission, all labelled. */
  preview: process.env.VG_PREVIEW === "1",
  shopifyDomain: process.env.SHOPIFY_STORE_DOMAIN,
  shopifyToken: process.env.SHOPIFY_STOREFRONT_TOKEN,
  shopifyReady: Boolean(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_TOKEN),
  /** Shopify Customer Account API: separate login system, its own client id + numeric shop id. */
  shopId: process.env.SHOPIFY_SHOP_ID,
  customerAccountClientId: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID,
  siteUrl: process.env.SITE_URL || "http://localhost:3000",
  customerAccountReady: Boolean(process.env.SHOPIFY_SHOP_ID && process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID),
};
