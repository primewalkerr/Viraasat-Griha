import "server-only";
import { config } from "./config";

const API_VERSION = "2025-01";
const SCOPE = "openid email customer-account-api:full";

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

function authBase(): string {
  return `https://shopify.com/authentication/${config.shopId}`;
}

export function redirectUri(): string {
  return `${config.siteUrl}/api/auth/callback`;
}

export type OAuthStart = { url: string; verifier: string; state: string };

/** Builds the redirect to Shopify's hosted login. Verifier/state must be stashed and checked on callback. */
export async function buildAuthorizeUrl(): Promise<OAuthStart> {
  const verifier = randomToken();
  const state = randomToken(16);
  const challenge = await pkceChallenge(verifier);
  const url = new URL(`${authBase()}/oauth/authorize`);
  url.searchParams.set("client_id", config.customerAccountClientId!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return { url: url.toString(), verifier, state };
}

export type TokenSet = { accessToken: string; refreshToken: string; idToken: string; expiresAt: number };

function toTokenSet(json: any): TokenSet {
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    idToken: json.id_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export async function exchangeCode(code: string, verifier: string): Promise<TokenSet | null> {
  try {
    const res = await fetch(`${authBase()}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.customerAccountClientId!,
        redirect_uri: redirectUri(),
        code,
        code_verifier: verifier,
      }),
    });
    if (!res.ok) { console.error("Shopify token exchange failed:", res.status, await res.text()); return null; }
    return toTokenSet(await res.json());
  } catch (e) {
    console.error("Shopify token exchange:", e);
    return null;
  }
}

export async function refreshTokens(refreshToken: string): Promise<TokenSet | null> {
  try {
    const res = await fetch(`${authBase()}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.customerAccountClientId!,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    return toTokenSet(await res.json());
  } catch (e) {
    console.error("Shopify token refresh:", e);
    return null;
  }
}

export function logoutUrl(idToken: string): string {
  const url = new URL(`${authBase()}/logout`);
  url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set("post_logout_redirect_uri", config.siteUrl);
  return url.toString();
}

/* ------------------------------------------------------------- customer data */

async function customerAccountFetch<T>(accessToken: string, query: string, variables?: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`https://shopify.com/${config.shopId}/account/customer/api/${API_VERSION}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: accessToken },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!res.ok) { console.error("Shopify Customer Account API:", res.status, await res.text()); return null; }
    const json = await res.json();
    if (json.errors) { console.error("Shopify Customer Account API:", json.errors); return null; }
    return json.data as T;
  } catch (e) {
    console.error("Shopify Customer Account API:", e);
    return null;
  }
}

export type CustomerOrder = { id: string; number: string; date: string; status: string; total: string; images: string[] };
export type CustomerAddress = { id: string; name: string | null; address1: string | null; address2: string | null; city: string | null; province: string | null; zip: string | null; phone: string | null; isDefault: boolean };
export type Customer = { firstName: string | null; lastName: string | null; email: string | null; orders: CustomerOrder[]; addresses: CustomerAddress[] };

const CUSTOMER_QUERY = `
  query Customer {
    customer {
      firstName lastName
      emailAddress { emailAddress }
      defaultAddress { id }
      addresses(first: 10) {
        edges { node { id firstName lastName address1 address2 city zoneCode zip phoneNumber } }
      }
      orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
        edges { node {
          id name processedAt financialStatus fulfillmentStatus
          totalPrice { amount currencyCode }
          lineItems(first: 3) { edges { node { image { url } } } }
        } }
      }
    }
  }
`;

function formatPrice(amount: string, currency: string): string {
  const n = Number(amount);
  return currency === "INR" ? `₹${n.toLocaleString("en-IN")}` : `${currency} ${n.toLocaleString("en-IN")}`;
}

function humanStatus(fulfillment: string, financial: string): string {
  if (fulfillment === "FULFILLED") return "Delivered";
  if (fulfillment === "IN_PROGRESS" || fulfillment === "PARTIAL") return "Shipped";
  if (financial === "PAID") return "Processing";
  return "Pending";
}

export async function getCustomer(accessToken: string): Promise<Customer | null> {
  const data = await customerAccountFetch<{ customer: any }>(accessToken, CUSTOMER_QUERY);
  const c = data?.customer;
  if (!c) return null;
  return {
    firstName: c.firstName ?? null,
    lastName: c.lastName ?? null,
    email: c.emailAddress?.emailAddress ?? null,
    orders: (c.orders?.edges ?? []).map(({ node: o }: any) => ({
      id: o.id,
      number: o.name,
      date: new Date(o.processedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      status: humanStatus(o.fulfillmentStatus, o.financialStatus),
      total: formatPrice(o.totalPrice.amount, o.totalPrice.currencyCode),
      images: (o.lineItems?.edges ?? []).map((e: any) => e.node.image?.url).filter(Boolean),
    })),
    addresses: (c.addresses?.edges ?? []).map(({ node: a }: any) => ({
      id: a.id,
      name: [a.firstName, a.lastName].filter(Boolean).join(" ") || null,
      address1: a.address1 ?? null,
      address2: a.address2 ?? null,
      city: a.city ?? null,
      province: a.zoneCode ?? null,
      zip: a.zip ?? null,
      phone: a.phoneNumber ?? null,
      isDefault: a.id === c.defaultAddress?.id,
    })),
  };
}
