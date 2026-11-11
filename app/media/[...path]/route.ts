import { config } from "@/lib/config";
import { mediaFileAllowed, getMediaFileMeta, getMediaFileBytes } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Serves files from the media_files blob table in Turso. Only files recorded
 * in the media table, and allowed by their permission (or preview mode), are
 * served.
 */
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.join("/");
  if (!(await mediaFileAllowed(rel))) return new Response("Not found", { status: 404 });

  const meta = await getMediaFileMeta(rel);
  if (!meta) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": meta.contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": config.preview ? "no-store" : "public, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  };

  // Byte ranges let browsers scrub through videos.
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : meta.size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : meta.size - 1;
    start = Math.max(0, start); end = Math.min(end, meta.size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${meta.size}` } });
    const bytes = await getMediaFileBytes(rel, { start, end });
    if (!bytes) return new Response("Not found", { status: 404 });
    return new Response(bytes as BodyInit, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${meta.size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const bytes = await getMediaFileBytes(rel);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(bytes as BodyInit, { headers: { ...headers, "Content-Length": String(meta.size) } });
}
