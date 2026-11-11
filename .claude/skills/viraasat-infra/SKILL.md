---
name: viraasat-infra
description: Operational reference for how Viraasat Griha's infrastructure is wired together — Vercel (hosting), Turso (the production database, which also stores every photo/video as a blob), and Shopify (storefront, cart, checkout, customer login). Use this skill whenever working on deployment problems, checking why content or images aren't showing on the live site, debugging a Turso connection or deciding which Turso database is actually the live one, diagnosing a Shopify checkout or storefront-password issue, or any question about how this project's infra fits together — even if the user doesn't name a specific service, e.g. "why isn't this showing on vercel", "is turso connected", "shopify checkout isn't working", "which database do we use", "images are broken on the site", "env vars aren't working".
---

# Viraasat Griha infra playbook

This is a record of infra knowledge earned the hard way across a real
debugging session. Read it before touching deployment, the database, or
Shopify — it will save you from re-discovering the same traps.

## The shape of the system

- **App**: Next.js 16 (`viraasat-site/`), deployed on Vercel. Production
  domain: `https://viraasat-griha.vercel.app/`.
- **Database**: Turso (libSQL), via `@libsql/client` (`lib/db.ts`). Holds
  both editorial content (cities, crafts, media metadata — see
  `viraasat-pipeline/schema.sql` for the schema) *and* the raw bytes of
  every photo/video, in a `media_files` table (`path`, `content_type`,
  `data BLOB`, `size`). There is no separate object store — `/media/...`
  requests are served straight out of SQLite, using `substr()` for byte
  ranges so video scrubbing works.
- **Commerce**: Shopify Storefront API (products, cart, checkout) and
  Shopify Customer Account API (login), both entirely separate from
  Turso — `lib/shopify.ts` is the only file that talks to Shopify. Turso
  has zero product/price/cart data.

Before trusting any fact below as still current, spot-check it — this
was accurate as of the session that wrote it, and infra drifts.

## Canonical facts

- **The database that's actually live is not the obvious one.** Vercel's
  env vars point at a database auto-provisioned by Vercel's Turso
  Marketplace integration (hostname pattern
  `<name>-vercel-icfg-<random>.aws-ap-south-1.turso.io`) — not any
  database living in a personal/org Turso account. If a Turso MCP server
  is connected and scoped to an org, it very likely **cannot see or
  manage the Vercel-provisioned database at all** (different org/account
  entirely). Confirm which database is actually wired up by reading
  `TURSO_DATABASE_URL` from Vercel's current environment variables — do
  not assume it matches whatever database an MCP tool happens to list.
- **To run schema or data changes against the Vercel-provisioned
  database**, MCP tooling won't reach it. Use a small Node script with
  `@libsql/client`, authenticated with the exact `TURSO_DATABASE_URL` /
  `TURSO_AUTH_TOKEN` currently set in Vercel:
  ```js
  import { createClient } from "@libsql/client";
  const client = createClient({ url: "<TURSO_DATABASE_URL>", authToken: "<TURSO_AUTH_TOKEN>" });
  await client.execute("SELECT 1");
  ```
  `executeMultiple()` runs a whole multi-statement SQL file in one call.
- **Required env vars** (Vercel Settings → Environment Variables, and
  `viraasat-site/.env.local` for dev — same database both places, no
  local sqlite file involved anywhere anymore):
  `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `VG_PREVIEW`,
  `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_TOKEN`, and for customer
  login `SHOPIFY_SHOP_ID` / `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` /
  `SITE_URL`.
- **`VG_PREVIEW=1` is probably intentional, not a bug.** It shows
  draft/unreviewed cities and unverified media, clearly labelled. If
  content looks "empty" on the live site with this unset, that's the
  live-mode filter correctly hiding unpublished content — not a
  connection failure. Check `cities.status` / `media.permission` in the
  database before assuming something is broken.

## Gotchas (each of these cost real time — don't repeat them)

1. **Never use Vercel's Storage tab "Connect Resource" flow for Turso.**
   Every time it runs, it provisions a *brand-new, empty* Turso database
   under Vercel's managed account and points the project at that instead
   of any existing database — repeatedly, if you go through the flow
   more than once. This is how three different empty databases ended up
   connected in one session. To change the Turso connection, edit
   `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` as **plain environment
   variables** under Settings → Environment Variables instead, and leave
   the Storage/Marketplace integration alone.
2. **Env var changes need a redeploy.** Saving a new value in Vercel's
   dashboard does not affect an already-built deployment. If behavior
   doesn't change after editing an env var, check whether a redeploy
   actually happened (Deployments → latest → confirm timestamp, or
   trigger Deployments → "..." → Redeploy) before assuming the fix
   didn't work.
3. **A deployment-specific URL (the one with a random hash, e.g.
   `project-<hash>-team.vercel.app`) is a frozen snapshot.** It will
   never reflect a later push, and it's typically behind Vercel's SSO
   wall for anyone not logged into that Vercel team (so it can't be
   curled from outside a browser session either). Always verify fixes
   against the stable production domain, not a deployment URL someone
   pasted earlier in the conversation.
4. **Shopify checkout goes straight to Shopify's own hosted checkout**
   on the `*.myshopify.com` domain. If that storefront still has
   password protection on (Online Store → Preferences in Shopify
   admin), every checkout link — including real ones customers would
   use — hits the password wall first, and even after entering the
   password it can land back on the storefront root instead of
   continuing to the original link. That's expected Shopify behavior,
   not a bug in this app. If the "Password protection" toggle is
   greyed out, the store is probably still on a trial with no plan
   selected — a plan has to be chosen before the toggle is available.

## Quick diagnostics

```bash
# Is the production site up and serving real content?
curl -s -o /dev/null -w "%{http_code}\n" https://viraasat-griha.vercel.app/

# Does a given media file actually serve (and with the right type)?
curl -sI https://viraasat-griha.vercel.app/media/<path-from-media.local_path>

# Is Shopify wired in, or still showing placeholders?
curl -s https://viraasat-griha.vercel.app/art | grep -io "coming soon"   # present = Shopify NOT active
curl -s https://viraasat-griha.vercel.app/bag  | grep -io "bag is empty" # just means nothing's in a cart right now
```

If the site is 500ing, check whether the error is actually reaching the
database at all (not just whether env vars look right): query is cheap
and tells you a lot —

```js
// using @libsql/client with the live TURSO_DATABASE_URL/TURSO_AUTH_TOKEN
await client.execute("SELECT count(*) FROM cities");
```

An error here (vs. a successful query returning 0 rows) distinguishes
"can't connect" from "connected fine, just no published content."
