"use client";
import React, { useCallback } from "react";
import CountdownBadge from "./CountdownBadge";
import SignalStatic from "./SignalStatic";

interface Props {
  name: string;
  stream: string | null;
  windowStart?: string;              // ISO for countdown (only when UTC known)
  onStreamClick?: (stream: string) => void;
}

function normalizeStreamUrl(raw: string): string {
  try {
    if (/\/embed\//i.test(raw)) return raw;
    if (/youtube\.com\/watch\?v=/i.test(raw)) {
      const url = new URL(raw);
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : raw;
    }
    if (/youtu\.be\//i.test(raw)) {
      const id = raw.split("youtu.be/")[1]?.split(/[?&#]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : raw;
    }
    return raw;
  } catch {
    return raw;
  }
}

export default function LaunchPanel({ name, stream, windowStart, onStreamClick }: Props) {
  const handleActivate = useCallback(() => {
    if (stream) onStreamClick?.(stream);
  }, [stream, onStreamClick]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!stream) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onStreamClick?.(stream);
      }
    },
    [stream, onStreamClick]
  );

  const embed = stream ? normalizeStreamUrl(stream) : null;

  return (
    <div className="bg-black border border-black overflow-hidden h-full">
      <div
        className="relative aspect-video w-full bg-black group"
        role={embed ? "button" : undefined}
        tabIndex={embed ? 0 : -1}
        aria-label={embed ? `Maximize stream: ${name}` : `No stream available for ${name}`}
        onClick={embed ? handleActivate : undefined}
        onKeyDown={embed ? handleKey : undefined}
        title={embed ? "Click to maximize" : undefined}
      >
        {embed ? (
          <>
            <iframe
              src={embed}
              className="w-full h-full pointer-events-none"
              allow="autoplay; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              title={name}
            />
            <div className="absolute inset-0 cursor-zoom-in" />
          </>
        ) : (
          // Static with a big centered countdown; if no ISO, we fall back to the badge (or nothing)
          <div className="absolute inset-0 flex items-center justify-center">
            <SignalStatic className="absolute inset-0" fps={24} opacity={0.9} />
            {windowStart ? (
              <CountdownBadge iso={windowStart} variant="big" className="z-10 bg-black/50 px-4 py-2" />
            ) : (
              <div className="z-10 text-white/80 font-mono text-xl bg-black/70 px-3 py-2">
                {"No precise time yet."}
              </div>
            )}
            {/* subtle CRT scanline vibe */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                background:
                  "repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 3px)",
                mixBlendMode: "overlay",
              }}
            />
          </div>
        )}

        {/* Title bar */}
        <div className="absolute bottom-0 left-0 right-0 h-7 bg-black/80 border-t border-white/10 px-2 flex items-center">
          <span className="text-white font-mono text-[11px] truncate" title={name}>
            {name}
          </span>
        </div>

        {/* Small badge in the corner (kept) */}
        <div className="absolute top-2 right-2">
          <CountdownBadge iso={windowStart} />
        </div>
      </div>
    </div>
  );
}
