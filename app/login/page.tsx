import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";
import { listCities } from "@/lib/site";
import { readSession } from "@/lib/customer-session";
import Photo from "@/components/Photo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  auth_failed: "That login did not go through. Please try again.",
  not_configured: "Accounts are not set up on this site yet.",
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const session = await readSession();
  if (session) redirect("/account");

  const { error } = await searchParams;
  const city = listCities().find((c) => c.photo) ?? null;

  return (
    <main className="login-split">
      <div className="photo-pane">
        <Photo media={city?.photo ?? null} alt={city ? `Craft of ${city.name}` : "A craft city of India"} />
        <div className="overlay" />
        <div className="caption">
          <p className="kicker">A home for Indian art</p>
          <p className="quote">Welcome back. Your bag, orders and addresses are waiting.</p>
        </div>
      </div>
      <div className="form-pane">
        <div className="login-card">
          <p className="eyebrow">My account</p>
          <h1 className="display h1">Log in</h1>
          <p className="lede">
            We send a 6-digit code to your email — no password to remember. New here? We will create your account.
          </p>
          {error && <p className="login-error">{ERRORS[error] ?? "Something went wrong. Please try again."}</p>}
          {config.customerAccountReady ? (
            <a className="btn" href="/api/auth/login">Continue with email</a>
          ) : (
            <p className="login-error">Accounts open once the shop finishes setting up Shopify login.</p>
          )}
          <p className="note">By continuing you agree to the terms and the privacy policy.</p>
        </div>
      </div>
    </main>
  );
}
