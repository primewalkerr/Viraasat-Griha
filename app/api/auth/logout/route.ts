import { NextRequest, NextResponse } from "next/server";
import { logoutUrl } from "@/lib/customer-auth";
import { clearSession, readSession } from "@/lib/customer-session";

export async function GET(request: NextRequest) {
  const session = await readSession();
  await clearSession();
  if (session?.idToken) {
    return NextResponse.redirect(logoutUrl(session.idToken));
  }
  return NextResponse.redirect(new URL("/", request.url));
}
