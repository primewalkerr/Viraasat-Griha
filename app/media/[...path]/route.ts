import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { config } from "@/lib/config";
import { mediaFileAllowed } from "@/lib/site";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
  ".avif": "image/avif", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
};

/**
 * Serves files from the admin's media folder. Only files recorded in the media
 * table, and allowed by their permission (or preview mode), are served.
 */
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.join("/");
  const type = TYPES[path.extname(rel).toLowerCase()];
  const full = path.resolve(config.mediaDir, rel);
  if (!type || !full.startsWith(config.mediaDir + path.sep) || !(await mediaFileAllowed(rel))) {
    return new Response("Not found", { status: 404 });
  }
  let size: number;
  try { size = fs.statSync(full).size; } catch { return new Response("Not found", { status: 404 }); }

  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": config.preview ? "no-store" : "public, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  };

  // Byte ranges let browsers scrub through videos.
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : size - 1;
    start = Math.max(0, start); end = Math.min(end, size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const body = Readable.toWeb(fs.createReadStream(full, { start, end })) as ReadableStream;
    return new Response(body, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const body = Readable.toWeb(fs.createReadStream(full)) as ReadableStream;
  return new Response(body, { headers: { ...headers, "Content-Length": String(size) } });
}
