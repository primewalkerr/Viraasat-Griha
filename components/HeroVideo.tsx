"use client";

import { useState } from "react";
import { SoundOffIcon, SoundOnIcon } from "./Icons";

export default function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const [muted, setMuted] = useState(true);
  return (
    <>
      <video className="hero-media" src={src} poster={poster} autoPlay muted={muted} loop playsInline preload="auto" aria-hidden="true" />
      <button type="button" className="video-sound" aria-label={muted ? "Unmute video" : "Mute video"} onClick={() => setMuted((m) => !m)}>
        {muted ? <SoundOffIcon /> : <SoundOnIcon />}
      </button>
    </>
  );
}
