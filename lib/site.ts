import "server-only";
import { all, get, run, tableExists } from "./db";
import { config } from "./config";
import { stateHindi } from "./content";

/* ------------------------------------------------------------------ types */

export type Permission = "not_asked" | "requested" | "granted" | "refused" | "own";

export type Media = {
  id: number;
  kind: "photo" | "video";
  src: string;            // URL the browser loads (media CDN, local /media route, or remote)
  poster: string | null;
  alt: string;
  creditName: string | null;
  creditUrl: string | null;
  sourceUrl: string | null;
  permission: Permission;
  cleared: boolean;       // granted or own: may be published
};

export type CityCard = {
  slug: string;
  name: string;
  nameHi: string | null;
  state: string;
  stateHi: string | null;
  craft: string | null;
  category: string | null;
  pin: number;            // 1..n in map order
  mapX: number | null;    // on the 640 x 700 India drawing
  mapY: number | null;
  photo: Media | null;
  status: string;
  searchText: string;
};

export type Paragraph = { body: string; checked: boolean; sources: { title: string; url: string | null }[] };

export type CraftTab = {
  slug: string;
  name: string;
  category: string;
  thumb: Media | null;
  paragraphs: Paragraph[];
  film: Media | null;
  videos: Media[];
  giYear: number | null;
  giTag: boolean;
};

export type Store = {
  name: string;
  address: string | null;
  rating: number | null;
  ratingCount: number | null;
  ratingCheckedAt: string | null;
  link: string | null;
  verified: boolean;
};

export type CityPage = {
  city: CityCard & { tagline: string | null; district: string | null };
  slides: Media[];
  crafts: CraftTab[];
  stores: Store[];
};

/* ------------------------------------------------------------- the rules */

const LIVE = ["published"];
const PREVIEW = ["published", "in_review", "draft"];
const visibleStatuses = () => (config.preview ? PREVIEW : LIVE);
const isCleared = (p: string) => p === "granted" || p === "own";
const mayShow = (p: string) => (config.preview ? p !== "refused" : isCleared(p));
const inList = (n: number) => Array(n).fill("?").join(",");

/* ------------------------------------------------------------------ media */

type MediaRow = {
  id: number; kind: "photo" | "video"; url: string | null; local_path: string | null;
  poster_url: string | null; poster_path: string | null; alt_text: string | null;
  credit_name: string | null; credit_url: string | null; source_url: string | null;
  permission: Permission; city_id: number | null; craft_id: number | null;
};

/** media.local_path is a path into the media_files table (served by the
 *  /media route); local_path-based files are known to be a directly playable
 *  file, unlike a bare `url` link-out. */
const fileUrl = (p: string) => "/media/" + p.split("/").map(encodeURIComponent).join("/");

function toMedia(r: MediaRow | undefined): Media | null {
  if (!r || !mayShow(r.permission)) return null;
  const src = r.local_path ? fileUrl(r.local_path) : r.url;
  if (!src) return null;
  // A video with no local file (e.g. a YouTube link) can't play in place.
  if (r.kind === "video" && !r.local_path) return null;
  return {
    id: r.id, kind: r.kind, src,
    poster: r.poster_path ? fileUrl(r.poster_path) : r.poster_url,
    alt: r.alt_text || "",
    creditName: r.credit_name?.trim() || null,
    creditUrl: r.credit_url, sourceUrl: r.source_url,
    permission: r.permission, cleared: isCleared(r.permission),
  };
}

function allMedia(): Promise<MediaRow[]> {
  return all<MediaRow>("SELECT * FROM media ORDER BY id");
}

/** Media the site may serve at /media/<path> (blocks files without permission). */
export async function mediaFileAllowed(relPath: string): Promise<boolean> {
  const rows = await all<{ permission: string }>(
    "SELECT permission FROM media WHERE local_path = ? OR poster_path = ?", [relPath, relPath]);
  return rows.some((r) => mayShow(r.permission));
}

export type MediaFileMeta = { contentType: string; size: number };

/** A file's content type and byte size, from the media_files blob table. */
export async function getMediaFileMeta(relPath: string): Promise<MediaFileMeta | null> {
  const row = await get<{ content_type: string; size: number }>(
    "SELECT content_type, size FROM media_files WHERE path = ?", [relPath]);
  return row ? { contentType: row.content_type, size: row.size } : null;
}

/** The file's bytes, or a byte range of them (both ends inclusive) for scrubbing. */
export async function getMediaFileBytes(relPath: string, range?: { start: number; end: number }): Promise<Uint8Array | null> {
  const row = range
    ? await get<{ data: ArrayBuffer }>(
        "SELECT substr(data, ?, ?) AS data FROM media_files WHERE path = ?",
        [range.start + 1, range.end - range.start + 1, relPath])
    : await get<{ data: ArrayBuffer }>("SELECT data FROM media_files WHERE path = ?", [relPath]);
  return row ? new Uint8Array(row.data) : null;
}

/* ----------------------------------------------------------------- cities */

type CityRow = {
  id: number; slug: string; name: string; name_hi: string | null; state: string; district: string | null;
  lat: number | null; lon: number | null; pin_number: number | null; map_x: number | null; map_y: number | null;
  tagline: string | null; aliases: string | null; hero_media_id: number | null; card_media_id: number | null;
  status: string; craft: string | null; craft_keywords: string | null; category: string | null;
};

function parseList(json: string | null): string[] {
  try { const v = JSON.parse(json || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
}

/**
 * Cities without a map position get one from their latitude and longitude,
 * using a straight-line fit to the cities that do have one.
 */
function fillMapPositions(rows: CityRow[]): Map<number, { x: number; y: number }> {
  const out = new Map<number, { x: number; y: number }>();
  const known = rows.filter((r) => r.map_x != null && r.map_y != null && r.lat != null && r.lon != null);
  const fit = (pick: (r: CityRow) => number) => {
    // least squares for v = a*lon + b*lat + c
    const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], B = [0, 0, 0];
    for (const r of known) {
      const f = [r.lon!, r.lat!, 1], v = pick(r);
      for (let i = 0; i < 3; i++) { B[i] += f[i] * v; for (let j = 0; j < 3; j++) A[i][j] += f[i] * f[j]; }
    }
    return solve3(A, B);
  };
  const fx = known.length >= 3 ? fit((r) => r.map_x!) : null;
  const fy = known.length >= 3 ? fit((r) => r.map_y!) : null;
  for (const r of rows) {
    if (r.map_x != null && r.map_y != null) out.set(r.id, { x: r.map_x, y: r.map_y });
    else if (fx && fy && r.lat != null && r.lon != null)
      out.set(r.id, { x: fx[0] * r.lon + fx[1] * r.lat + fx[2], y: fy[0] * r.lon + fy[1] * r.lat + fy[2] });
  }
  return out;
}

function solve3(A: number[][], B: number[]): number[] | null {
  const M = A.map((row, i) => [...row, B[i]]);
  for (let c = 0; c < 3; c++) {
    let p = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-9) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < 3; r++) if (r !== c) {
      const k = M[r][c] / M[c][c];
      for (let k2 = c; k2 < 4; k2++) M[r][k2] -= k * M[c][k2];
    }
  }
  return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]];
}

function cityRows(): Promise<CityRow[]> {
  const st = visibleStatuses();
  return all<CityRow>(`
    SELECT c.*, cr.name AS craft, cr.keywords AS craft_keywords, cat.name AS category
    FROM cities c
    LEFT JOIN city_crafts cc ON cc.city_id = c.id AND cc.is_featured = 1
    LEFT JOIN crafts cr      ON cr.id = cc.craft_id AND cr.status <> 'hidden'
    LEFT JOIN categories cat ON cat.id = cr.category_id
    WHERE c.status IN (${inList(st.length)})
    ORDER BY c.pin_number IS NULL, c.pin_number, c.name`, st);
}

function cardFor(r: CityRow, pin: number, pos: { x: number; y: number } | undefined, media: MediaRow[], byId: Map<number, MediaRow>, extra = ""): CityCard {
  const photo =
    toMedia(r.card_media_id ? byId.get(r.card_media_id) : undefined) ??
    toMedia(r.hero_media_id ? byId.get(r.hero_media_id) : undefined) ??
    media.filter((m) => m.city_id === r.id && m.kind === "photo").map(toMedia).find(Boolean) ?? null;
  return {
    slug: r.slug, name: r.name, nameHi: r.name_hi, state: r.state, stateHi: stateHindi[r.state] ?? null,
    craft: r.craft, category: r.category, pin, mapX: pos?.x ?? null, mapY: pos?.y ?? null,
    photo, status: r.status,
    searchText: [r.name, r.name_hi, r.state, r.district, r.craft, ...parseList(r.aliases), ...parseList(r.craft_keywords), extra]
      .filter(Boolean).join(" ").toLowerCase(),
  };
}

/** Every city the visitor may see, in map order. */
export async function listCities(): Promise<CityCard[]> {
  const [rows, media, extraCrafts] = await Promise.all([cityRows(), allMedia(), craftNamesByCity()]);
  const byId = new Map(media.map((m) => [m.id, m]));
  const pos = fillMapPositions(rows);
  return rows.map((r, i) => cardFor(r, i + 1, pos.get(r.id), media, byId, extraCrafts.get(r.id) ?? ""));
}

async function craftNamesByCity(): Promise<Map<number, string>> {
  const rows = await all<{ city_id: number; names: string }>(`
    SELECT cc.city_id, group_concat(cr.name || ' ' || IFNULL(cr.keywords, ''), ' ') AS names
    FROM city_crafts cc JOIN crafts cr ON cr.id = cc.craft_id
    WHERE cr.status <> 'hidden' GROUP BY cc.city_id`);
  return new Map(rows.map((r) => [r.city_id, r.names]));
}

/** One card per craft of each visible city, for All art. */
export async function listArt() {
  const cities = new Map((await listCities()).map((c) => [c.slug, c]));
  const media = await allMedia();
  const st = visibleStatuses();
  const rows = await all<{
    city_id: number; city_slug: string; craft_id: number; slug: string; name: string; category: string;
    is_featured: number; shop_live: number;
  }>(`
    SELECT c.id AS city_id, c.slug AS city_slug, cr.id AS craft_id, cr.slug, cr.name, cat.name AS category,
           cc.is_featured, cr.making_media_id,
           EXISTS (SELECT 1 FROM shop_collections sc WHERE sc.craft_id = cr.id AND sc.is_live = 1) AS shop_live
    FROM city_crafts cc
    JOIN cities c ON c.id = cc.city_id
    JOIN crafts cr ON cr.id = cc.craft_id AND cr.status <> 'hidden'
    JOIN categories cat ON cat.id = cr.category_id
    WHERE c.status IN (${inList(st.length)})
    ORDER BY c.pin_number IS NULL, c.pin_number, cc.is_featured DESC, cc.sort_order, cr.name`, st);
  return rows.map((r, i) => {
    const city = cities.get(r.city_slug)!;
    const craftPhoto = media.filter((m) => m.kind === "photo" && m.craft_id === r.craft_id && m.city_id === r.city_id)
      .map(toMedia).find(Boolean);
    return {
      key: r.city_slug + "/" + r.slug, productSlug: r.city_slug + "-" + r.slug, order: i, craft: r.name, category: r.category,
      city: city.name, citySlug: city.slug, state: city.state,
      photo: (r.is_featured ? city.photo : null) ?? craftPhoto ?? city.photo,
      shopLive: !!r.shop_live && config.shopifyReady,
    };
  });
}

export type ArtCard = Awaited<ReturnType<typeof listArt>>[number];

/** One craft of one city, by the slug listArt() gives it. For the (placeholder) product page. */
export async function getProduct(productSlug: string): Promise<ArtCard | null> {
  return (await listArt()).find((a) => a.productSlug === productSlug) ?? null;
}

/* -------------------------------------------------------------- city page */

export async function getCityPage(slug: string): Promise<CityPage | null> {
  const all_ = await cityRows();
  const row = all_.find((r) => r.slug === slug);
  if (!row) return null;
  const media = await allMedia();
  const byId = new Map(media.map((m) => [m.id, m]));
  const pos = fillMapPositions(all_);
  const card = cardFor(row, all_.indexOf(row) + 1, pos.get(row.id), media, byId);

  // Slider: hero first, then the city's other photos.
  const photos = media.filter((m) => m.city_id === row.id && m.kind === "photo");
  const slideRows = [row.hero_media_id ? byId.get(row.hero_media_id) : undefined, ...photos]
    .filter((m): m is MediaRow => !!m && m.kind === "photo");
  const seen = new Set<number>();
  const slides = slideRows.filter((m) => !seen.has(m.id) && seen.add(m.id)).map(toMedia).filter((m): m is Media => !!m).slice(0, 8);
  if (!slides.length && card.photo) slides.push(card.photo);

  const craftRows = await all<{
    id: number; slug: string; name: string; category: string; making_media_id: number | null;
    gi_tag: number; gi_year: number | null;
  }>(`
    SELECT cr.*, cat.name AS category, cc.is_featured
    FROM city_crafts cc JOIN crafts cr ON cr.id = cc.craft_id JOIN categories cat ON cat.id = cr.category_id
    WHERE cc.city_id = ? AND cr.status <> 'hidden'
    ORDER BY cc.is_featured DESC, cc.sort_order, cr.name`, [row.id]);

  const cityVideos = media.filter((m) => m.city_id === row.id && m.kind === "video");
  const crafts: CraftTab[] = await Promise.all(craftRows.map(async (cr) => {
    const paraRows = await all<{ id: number; body: string; fact_status: string }>(`
      SELECT id, body, fact_status FROM craft_story_paragraphs
      WHERE craft_id = ? AND (city_id IS NULL OR city_id = ?) ORDER BY position, id`, [cr.id, row.id]);
    const paragraphs = await Promise.all(
      paraRows
        .filter((p) => p.fact_status === "checked" || (config.preview && p.fact_status !== "disputed"))
        .map(async (p) => ({
          body: p.body, checked: p.fact_status === "checked",
          sources: (await all<{ title: string; publisher: string | null; url: string | null }>(`
            SELECT s.title, s.publisher, s.url FROM paragraph_sources ps JOIN sources s ON s.id = ps.source_id
            WHERE ps.paragraph_id = ? ORDER BY s.id`, [p.id]))
            .map((s) => ({ title: s.publisher ? `${s.title}, ${s.publisher}` : s.title, url: s.url })),
        })),
    );
    const own = cityVideos.filter((m) => m.craft_id === cr.id || (m.craft_id == null && craftRows.length === 1));
    const videos = own.map(toMedia).filter((m): m is Media => !!m);
    // Cleared videos first, so the film slot shows a publishable one when there is one.
    videos.sort((a, b) => Number(b.cleared) - Number(a.cleared));
    const film = toMedia(cr.making_media_id ? byId.get(cr.making_media_id) : undefined) ?? videos[0] ?? null;
    const thumb = media.filter((m) => m.kind === "photo" && m.craft_id === cr.id && m.city_id === row.id)
      .map(toMedia).find(Boolean) ?? card.photo;
    return {
      slug: cr.slug, name: cr.name, category: cr.category, thumb, paragraphs, film,
      videos: videos.filter((v) => v.id !== film?.id), giTag: !!cr.gi_tag, giYear: cr.gi_year,
    };
  }));

  const storeRows = await all<{
    name: string; address: string | null; rating: number | null; rating_count: number | null;
    rating_checked_at: string | null; maps_url: string | null; google_place_id: string | null;
    website: string | null; verified: number;
  }>(`
    SELECT * FROM stores WHERE city_id = ? ${config.preview ? "" : "AND verified = 1"}
    ORDER BY verified DESC, sort_order, id LIMIT 5`, [row.id]);
  const stores = storeRows.map((s) => ({
    name: s.name, address: s.address, rating: s.rating, ratingCount: s.rating_count,
    ratingCheckedAt: s.rating_checked_at, verified: !!s.verified,
    link: s.maps_url || (s.google_place_id ? `https://www.google.com/maps/place/?q=place_id:${s.google_place_id}` : s.website),
  }));

  return { city: { ...card, tagline: row.tagline, district: row.district }, slides, crafts, stores };
}

/* ------------------------------------------------------------------- home */

/** The home page background film: the admin's explicit pick (site_settings),
 *  falling back to the first cleared video if none is set or it's not
 *  playable (e.g. permission was since refused). */
export async function heroVideo(): Promise<Media | null> {
  const media = await allMedia();
  if (await tableExists("site_settings")) {
    const row = await get<{ value: string | null }>(
      "SELECT value FROM site_settings WHERE key = 'homepage_video_media_id'");
    const pickedId = row?.value ? Number(row.value) : null;
    const picked = pickedId ? toMedia(media.find((m) => m.id === pickedId)) : null;
    if (picked) return picked;
  }
  const rows = media.filter((m) => m.kind === "video" && m.local_path);
  rows.sort((a, b) => Number(isCleared(b.permission)) - Number(isCleared(a.permission)));
  return rows.map(toMedia).find(Boolean) ?? null;
}

export async function popularSearchTerms(fallback: string[]): Promise<string[]> {
  if (!(await tableExists("popular_searches"))) return fallback;
  const rows = await all<{ term: string }>("SELECT term FROM popular_searches ORDER BY position");
  return rows.length ? rows.map((r) => r.term) : fallback;
}

/* --------------------------------------------------------------- contact */

const CONTACT_TABLE = `
CREATE TABLE IF NOT EXISTS contact_messages (
  id                  INTEGER PRIMARY KEY,
  shopify_customer_id TEXT,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  order_name          TEXT,
  topic               TEXT NOT NULL CHECK (topic IN ('craft','order','shipping_returns','work_with_us','other')),
  message             TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','replied','closed')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export async function saveContactMessage(m: { name: string; email: string; orderName: string | null; topic: string; message: string }) {
  await run(CONTACT_TABLE); // same definition as viraasat_schema.sql
  await run("INSERT INTO contact_messages (name, email, order_name, topic, message) VALUES (?, ?, ?, ?, ?)",
    [m.name, m.email, m.orderName, m.topic, m.message]);
}
