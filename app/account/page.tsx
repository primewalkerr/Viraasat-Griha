import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountTabs from "@/components/AccountTabs";
import { getCustomer } from "@/lib/customer-auth";
import { readSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  // Access tokens expire in ~1hr; refresh (which needs a writable cookie) happens in a Route Handler, not here.
  if (Date.now() >= session.expiresAt - 60_000) redirect("/api/auth/refresh?next=/account");

  const customer = await getCustomer(session.accessToken);
  if (!customer) redirect("/login?error=auth_failed");

  return (
    <main className="main">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p className="eyebrow">My account</p>
        <h1 className="display h1">Hello, {customer.firstName || "there"}</h1>
        <p className="lede" style={{ margin: 0 }}>Logged in as {customer.email}</p>
      </div>
      <AccountTabs customer={customer} />
    </main>
  );
}
