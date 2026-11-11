import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/customer-auth";
import { clearOAuthPending, readOAuthPending, writeSession } from "@/lib/customer-session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const pending = await readOAuthPending();
  await clearOAuthPending();

  if (!code || !state || !pending || state !== pending.state) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }

  const tokens = await exchangeCode(code, pending.verifier);
  if (!tokens) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }

  await writeSession(tokens);
  return NextResponse.redirect(new URL("/account", request.url));
}
