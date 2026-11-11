import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { buildAuthorizeUrl } from "@/lib/customer-auth";
import { writeOAuthPending } from "@/lib/customer-session";

export async function GET(request: NextRequest) {
  if (!config.customerAccountReady) {
    return NextResponse.redirect(new URL("/login?error=not_configured", request.url));
  }
  const { url, verifier, state } = await buildAuthorizeUrl();
  await writeOAuthPending({ verifier, state });
  return NextResponse.redirect(url);
}
