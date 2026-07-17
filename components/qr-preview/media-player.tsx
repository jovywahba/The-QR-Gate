"use client";

import * as React from "react";

/** Format seconds as m:ss (only ever from real loaded metadata). */
function fmt(seconds: number): string {
  if (!Number.isFinite(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Real <video controls> for an uploaded/hosted file. No fake thumbnail. */
export function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  return (
    <video
      key={src}
      controls
      preload="metadata"
      poster={poster}
      src={src}
      className="aspect-video w-full bg-black"
    >
      Your browser can&apos;t play this video. <a href={src}>Open the file.</a>
    </video>
  );
}

/**
 * Real <audio controls>. Reads the true duration from the loaded media
 * (never fabricated) and surfaces it once known.
 */
export function AudioPlayer({ src, onDuration }: { src: string; onDuration?: (s: number) => void }) {
  const ref = React.useRef<HTMLAudioElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !onDuration) return;
    const handler = () => Number.isFinite(el.duration) && onDuration(el.duration);
    el.addEventListener("loadedmetadata", handler);
    el.addEventListener("durationchange", handler);
    return () => {
      el.removeEventListener("loadedmetadata", handler);
      el.removeEventListener("durationchange", handler);
    };
  }, [onDuration]);
  return (
    <audio ref={ref} key={src} controls preload="metadata" src={src} className="w-full">
      Your browser can&apos;t play this audio. <a href={src}>Open the file.</a>
    </audio>
  );
}

/** Small hook: real duration text for an audio/video src, or "". */
export function useMediaDuration(): [string, (s: number) => void] {
  const [dur, setDur] = React.useState("");
  const set = React.useCallback((s: number) => setDur(fmt(s)), []);
  return [dur, set];
}
