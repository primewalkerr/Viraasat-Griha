import "server-only";
import { cookies } from "next/headers";
import { refreshTokens, type TokenSet } from "./customer-auth";

const SESSION_COOKIE = "vg_customer_session";
const OAUTH_COOKIE = "vg_oauth_pending";

/** Read-only: safe to call from Server Components. */
export async function readSession(): Promise<TokenSet | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenSet;
  } catch {
    return null;
  }
}

/** Only callable from a Route Handler or Server Action (cookies() there is read-write). */
export async function writeSession(tokens: TokenSet) {
  (await cookies()).set(SESSION_COOKIE, JSON.stringify(tokens), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function writeOAuthPending(data: { verifier: string; state: string }) {
  (await cookies()).set(OAUTH_COOKIE, JSON.stringify(data), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 600,
  });
}

export async function readOAuthPending(): Promise<{ verifier: string; state: string } | null> {
  const raw = (await cookies()).get(OAUTH_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearOAuthPending() {
  (await cookies()).delete(OAUTH_COOKIE);
}

/**
 * A valid access token for the signed-in customer, refreshing (and re-persisting) it if expired.
 * Only callable from a Route Handler or Server Action, since refreshing rewrites the cookie.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const session = await readSession();
  if (!session) return null;
  if (Date.now() < session.expiresAt - 60_000) return session.accessToken;
  const fresh = await refreshTokens(session.refreshToken);
  if (!fresh) {
    await clearSession();
    return null;
  }
  await writeSession(fresh);
  return fresh.accessToken;
}
