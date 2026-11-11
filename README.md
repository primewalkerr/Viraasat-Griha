# Viraasat Griha website

Next.js site for exploring Indian crafts by city. It reads the same `viraasat.db`
that the admin (`../viraasat-pipeline/ui.py`) writes, so what the team enters in
the admin shows on the site on the next page load.

## Run it

```bash
cd ~/Desktop/project-viraasat/viraasat-site
cp .env.example .env.local      # paths and preview switch
npm install
npm run dev                     # http://localhost:3000
```

Needs Node 20.9 or newer (`node -v`). The admin can run at the same time on port 8765.

## Preview and live

`VG_PREVIEW=1` (the default in `.env.example`) shows everything the team is
working on, with a red bar at the top and labels on anything not ready:

| Shown on the live site (`VG_PREVIEW=0`) | Extra in preview |
|---|---|
| Cities with status **published** | draft and in_review cities |
| Story paragraphs marked **checked** | unchecked paragraphs, marked "not checked" |
| Media with permission **granted** or **own** | not_asked / requested media, labelled |
| Shops marked **verified** | unverified shops, labelled |

Media files are served at `/media/...` only if a row in `media` points at them
and its permission allows it, so un-cleared videos can't be fetched by URL.

## Pages

| URL | What |
|---|---|
| `/` | Hero film, Best of Indian art, map of crafts, Featured Regions |
| `/art` | All art, filter by craft and state, sort |
| `/city/<slug>` | City page: photos, craft tabs, story + sources, films, shop, where to buy |
| `/search?q=` | Search over cities, crafts, states, aliases and craft keywords |
| `/about`, `/contact` | Contact form saves to `contact_messages` |
| `/shipping`, `/terms`, `/privacy` | Draft legal text from the design |
| `/bag`, `/wishlist`, `/login` | "Opening soon" until Shopify is connected |

Cities with no map position get one worked out from their latitude and longitude.

## Where things live

- `lib/site.ts`: every database query and the preview/live rules
- `lib/content.ts`: text not in the database yet (about page, support details, Hindi state names)
- `lib/legal.tsx`: shipping, terms and privacy wording
- `app/globals.css`: colours and type from the design's "Colour and type" board
- `components/`: header, footer, map, carousel, city hero, craft tabs, filters, search, contact form

## Before launch

- Fill the `[bracketed]` placeholders in `lib/content.ts` and `lib/legal.tsx`; have a lawyer review the legal pages.
- Replace the stylised India outline in `components/CraftMap.tsx` with a licensed boundary file.
- Get permission for each video and photo, and publish cities in the admin.
- Hosting: the site needs the database and media folder next to it (a small Node server or VPS),
  or the media moved to cloud storage. Vercel alone can't reach files on this Mac.
- Shop: connect Shopify (`SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_TOKEN`) and build bag, checkout,
  account and product pages from the design.
