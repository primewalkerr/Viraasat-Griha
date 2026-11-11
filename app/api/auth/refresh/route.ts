import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/customer-session";

/** Refreshes the customer session cookie, then returns to wherever the page that needed a fresh token asked. */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") || "/account";
  const token = await getValidAccessToken();
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.redirect(new URL(next, request.url));
}
