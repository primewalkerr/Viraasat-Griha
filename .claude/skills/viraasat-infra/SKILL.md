---
name: viraasat-infra
description: Operational reference for how Viraasat Griha's infrastructure is wired together — Vercel (hosting), Turso (the production database, holding editorial content and media metadata), Cloudinary (hosts the actual photo/video files), and Shopify (storefront, cart, checkout, customer login). Use this skill whenever working on deployment problems, checking why content, images or videos aren't showing on the live site, debugging a Turso connection or deciding which Turso database is actually the live one, debugging a Cloudinary upload or a "stream not found"/"interactive transaction was rolled back" Turso error, diagnosing a Shopify checkout or storefront-password issue, generating a Shopify Admin API token to write product data (the Storefront token can't), or any question about how this project's infra fits together — even if the user doesn't name a specific service, e.g. "why isn't this showing on vercel", "is turso connected", "shopify checkout isn't working", "which database do we use", "images are broken on the site", "video won't upload", "upload a product image to shopify", "env vars aren't working".
---

# Viraasat Griha infra playbook

This is a record of infra knowledge earned the hard way across a real
debugging session. Read it before touching deployment, the database, or
Shopify — it will save you from re-discovering the same traps.

## The shape of the system

- **App**: Next.js 16 (`viraasat-site/`), deployed on Vercel. Production
  domain: `https://viraasat-griha.vercel.app/`.
- **Database**: Turso (libSQL), via `@libsql/client` (`lib/db.ts`) on the
  site and a `libsql`-wrapped connection (`pipeline.connect()`) on the
  admin tool. Holds editorial content (cities, crafts, story paragraphs)
  and media metadata (see `viraasat-pipeline/schema.sql`) — but not the
  photo/video bytes themselves (see Media storage below).
- **Media storage**: Cloudinary. `media.local_path` / `media.poster_path`
  hold an absolute `https://res.cloudinary.com/...` URL for anything
  uploaded since the Cloudinary migration — the site's `fileUrl()`
  (`lib/site.ts`) passes an absolute URL straight through, and the admin
  tool's `push_media_file` (`sitedb.py`) uploads to Cloudinary via
  `cloud.py` whenever `CLOUDINARY_*` env vars are set. A relative path
  (no `http`) is the legacy form: a key into Turso's `media_files` blob
  table, served at `/media/<path>` straight out of SQLite (`substr()` for
  byte ranges so video scrubbing works). Without Cloudinary credentials
  configured, `push_media_file` falls back to this legacy blob-storage
  behavior (keeps the pipeline's own test suite offline). Why the move:
  large video blobs pushed/pulled through Turso's Hrana protocol were slow
  enough to expire the connection's stream mid-request — see Gotcha 5.
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
  `SITE_URL`. The site itself needs no Cloudinary credentials — it only
  ever reads the URL already stored in `media.local_path`.
- **The admin tool's env vars live only in `viraasat-pipeline/.env`**
  (gitignored, loaded by `pipeline._load_dotenv`): the same
  `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` as above, plus
  `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  for uploads. Cloudinary's "Cloud name" is a short auto-generated string
  (e.g. `dqnxa1vzt`) shown at the top of the Cloudinary console — it is
  **not** the account/product display name, which looks plausible but
  gets rejected by the API with `Invalid cloud_name`.
- **`VG_PREVIEW=1` is probably intentional, not a bug.** It shows
  draft/unreviewed cities and unverified media, clearly labelled. If
  content looks "empty" on the live site with this unset, that's the
  live-mode filter correctly hiding unpublished content — not a
  connection failure. Check `cities.status` / `media.permission` in the
  database before assuming something is broken.
- **`SHOPIFY_STOREFRONT_TOKEN` is read-only** (products, cart, checkout
  URLs) — it cannot write anything, including a product's image. For
  that you need a separate **Admin API access token**, which this
  project does not keep configured anywhere (not in `.env.local`, not in
  Vercel). Generate one when needed:
  1. Shopify admin → Settings → Apps and sales channels → **Develop
     apps** → Create an app (or reuse an existing one) → **Configure
     Admin API scopes** → enable what you need (e.g. `write_products`)
     → **Install app**.
  2. Its **API credentials** tab shows a `client_id` and `client_secret`
     (*not* the Admin API access token itself — don't confuse the two).
     Exchange them for a short-lived token with:
     ```bash
     curl -X POST "https://viraasatggriha.myshopify.com/admin/oauth/access_token" \
       -H "Content-Type: application/x-www-form-urlencoded" \
       --data-urlencode "grant_type=client_credentials" \
       --data-urlencode "client_id=<client_id>" \
       --data-urlencode "client_secret=<client_secret>"
     ```
     Returns `{"access_token":"shpat_...","scope":"...","expires_in":86399}`
     (~24h; just re-run the exchange when it expires — the client_id/
     secret themselves don't expire).
  3. Use the token as the `X-Shopify-Access-Token` header against
     `https://viraasatggriha.myshopify.com/admin/api/2025-01/graphql.json`.
     To attach an image to a product from a URL (no need to download/
     re-upload bytes yourself), look the product up by handle, then:
     ```graphql
     mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
       productCreateMedia(productId: $productId, media: $media) {
         media { ... on MediaImage { id image { url } } }
         mediaUserErrors { field message }
       }
     }
     ```
     with `media: [{ originalSource: "<image url>", mediaContentType: IMAGE }]`.
     Shopify fetches and re-hosts it on `cdn.shopify.com` asynchronously —
     poll `node(id: "<the returned MediaImage id>") { ... on MediaImage {
     status image { url } } }` until `status` is `READY` before expecting
     it to show up via the Storefront API.
  Treat every value here (client_id, client_secret, the exchanged
  `shpat_...` token) as a secret: never commit them, and if one is ever
  pasted into a chat transcript, rotate it (regenerate the client_secret
  on the app's API credentials page) rather than trust it's still safe
  to use.

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
5. **Turso's Hrana connection can die mid-request on anything slow** —
   a long `yt-dlp` download, or (before the Cloudinary migration) pushing
   a large video blob. Symptoms: `api error: status=404 ... "stream not
   found: ..."` on the next query after the slow step, or `SQLITE_BUSY
   ... "interactive transaction was rolled back because the stream was
   idle for too long"`. `pipeline._TursoConnection.execute` now
   auto-reconnects and retries once on "stream not found", and
   `sitedb.add_post` commits after each media item instead of one commit
   at the end, but a request that still dies between `pipeline.save()`'s
   own early commit (the reel row) and the later media-row insert leaves
   a **reel assigned to a city with no media row** — it shows up in
   `add_post`'s "already in X" duplicate check but never renders on the
   city page. Find these with:
   ```sql
   SELECT r.* FROM reels r WHERE r.city_id IS NOT NULL AND r.video_path IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM media m WHERE m.reel_id = r.id);
   ```
   `viraasat-pipeline/migrate_to_cloudinary.py` repairs exactly this case
   (and is safe to re-run — it only touches rows it finds in this state).

## Quick diagnostics

```bash
# Is the production site up and serving real content?
curl -s -o /dev/null -w "%{http_code}\n" https://viraasat-griha.vercel.app/

# Does a given media file actually serve (and with the right type)?
# If media.local_path starts with http(s), curl it directly (it's a Cloudinary URL).
# Otherwise it's a legacy relative path served out of Turso's media_files blob table:
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
