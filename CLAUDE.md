# Viraasat Griha site: notes for Claude Code

- Next.js App Router (Next 16, React 19), TypeScript, plain CSS in `app/globals.css`. No Tailwind.
- Data: `better-sqlite3`, read-only, on `../viraasat-pipeline/viraasat.db` (path from `VG_DB`).
  The admin owns that schema (`../viraasat-pipeline/schema.sql`); the site never changes it,
  except creating `contact_messages` (same definition as `viraasat_schema.sql`) on first use.
- All queries live in `lib/site.ts`. Keep the live rules there: published cities, checked
  paragraphs, granted/own media, verified shops. `VG_PREVIEW=1` relaxes them and labels items.
- Design source: the "Viraasat Griha Design" canvas on claude.ai (20 artboards). Colours:
  ivory #FBF8F1, ink #241F1A, muted #5E564C, indigo #1F2F5C, madder #9C3B2E, brass #A9803A.
  Type: Cormorant Garamond (display), Public Sans (body), Tiro Devanagari Hindi (Hindi, always small).
- Shop pages (bag, checkout, account, product, wishlist) are placeholders until Shopify is set up;
  Shopify holds products, carts, customers and orders, never this database.
- No AI-written story text: the team writes and sources the art text by hand.
- Check changes with `npm run build` and by opening pages in both preview and live mode.
