"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CountdownBadge from "./CountdownBadge";
import SignalStatic from "./SignalStatic";

interface Props {
  name: string;
  stream: string | null;
  windowStart?: string; // ISO for countdown (UTC/GMT only)
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

  // ---- Big center countdown for "no stream" state ----
  const targetMs = useMemo(() => (windowStart ? Date.parse(windowStart) : NaN), [windowStart]);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // cleanup old timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;

    if (Number.isNaN(targetMs)) return;

    const startDelay = 1000 - (Date.now() % 1000);
    timeoutRef.current = setTimeout(() => {
      setNowMs(Date.now());
      intervalRef.current = setInterval(() => setNowMs(Date.now()), 1000);
    }, startDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [targetMs]);

  const bigCountdownLabel = useMemo(() => {
    if (Number.isNaN(targetMs)) return null;
    const diff = targetMs - nowMs; // future => +
    const past = diff < 0;
    const abs = Math.abs(diff);
    const total = Math.floor(abs / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    const core =
      days > 0 ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
               : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return `${past ? "T+" : "T-"} ${core}`;
  }, [targetMs, nowMs]);

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
          <div className="absolute inset-0 flex items-center justify-center">
            <SignalStatic className="absolute inset-0" fps={24} opacity={0.9} />
            {bigCountdownLabel ? (
              <div
                className="z-10 text-white font-mono font-bold bg-black/50 px-4 py-2 rounded-sm select-none
                           text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                title={new Date(targetMs).toUTCString()}
                suppressHydrationWarning
              >
                {bigCountdownLabel}
              </div>
            ) : (
              <div className="z-10 text-white/80 font-mono text-xl bg-black/70 px-3 py-2 rounded-sm select-none">
                No precise time yet.
              </div>
            )}
            {/* subtle scanline overlay */}
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

        {/* Small corner badge (renders nothing if iso is missing/invalid) */}
        <div className="absolute top-2 right-2">
          <CountdownBadge iso={windowStart} />
        </div>
      </div>
    </div>
  );
}
