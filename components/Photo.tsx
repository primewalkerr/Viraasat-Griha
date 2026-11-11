import type { Media } from "@/lib/site";

/** A photo, or a calm placeholder when none may be shown yet. */
export default function Photo({ media, alt, className, label = "Photo to come" }: {
  media: Media | null; alt: string; className?: string; label?: string;
}) {
  if (!media) return <div className={"photo-missing " + (className ?? "")} role="img" aria-label={alt}>{label}</div>;
  return <img src={media.src} alt={media.alt || alt} className={className} loading="lazy" decoding="async" />;
}

export function Credit({ media }: { media: Media }) {
  if (!media.creditName) return null;
  return (
    <span>
      {media.kind === "video" ? "Video" : "Photo"} by{" "}
      {media.creditUrl ? <a href={media.creditUrl} target="_blank" rel="noopener noreferrer">{media.creditName}</a> : media.creditName}
      {media.sourceUrl && <> · <a href={media.sourceUrl} target="_blank" rel="noopener noreferrer">original post</a></>}
    </span>
  );
}
