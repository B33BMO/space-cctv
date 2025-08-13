"use client";
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  iso?: string | null;
  variant?: "badge" | "big"; // "badge" = small pill (default), "big" = hero countdown
  className?: string;        // optional extra classes
};

/** Normalize various ISO/UTC strings to a UTC millisecond timestamp. */
function toUtcMs(input?: string | null): number {
  if (!input) return NaN;
  let ms = Date.parse(input);
  if (!Number.isNaN(ms)) return ms;
  const isoNoZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(input);
  if (isoNoZ) {
    ms = Date.parse(input + "Z");
    if (!Number.isNaN(ms)) return ms;
  }
  ms = Date.parse(input.replace(/\./g, "")); // e.g., "Aug." -> "Aug"
  return ms;
}

export default function CountdownBadge({ iso, variant = "badge", className = "" }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const targetMs = useMemo(() => toUtcMs(iso), [iso]);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Tick aligned to next second boundary
  useEffect(() => {
    if (!mounted || Number.isNaN(targetMs)) return;
    const startDelay = 1000 - (Date.now() % 1000);
    const kick = setTimeout(() => {
      setNowMs(Date.now());
      const id = setInterval(() => setNowMs(Date.now()), 1000);
      (kick as any)._interval = id;
    }, startDelay);

    return () => {
      clearTimeout(kick);
      if ((kick as any)._interval) clearInterval((kick as any)._interval);
    };
  }, [mounted, targetMs]);

  if (!mounted || Number.isNaN(targetMs)) return null;

  const diff = targetMs - nowMs; // future => +
  const past = diff < 0;
  const abs = Math.abs(diff);

  const totalSec = Math.floor(abs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  const core =
    days > 0
      ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const label = `${past ? "T+" : "T-"} ${core}`;

  if (variant === "big") {
    // Large, center-stage countdown (no border)
    return (
      <div
        className={`text-white font-mono font-bold select-none ${
          // responsive sizes: sm / md / lg
          "text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
        } ${className}`}
        title={new Date(targetMs).toUTCString()}
        suppressHydrationWarning
      >
        {label}
      </div>
    );
  }

  // Default: small pill
  return (
    <div
      className={`bg-black/80 text-white font-mono text-[11px] px-2 py-1 border border-white/20 ${className}`}
      title={new Date(targetMs).toUTCString()}
      suppressHydrationWarning
    >
      {label}
    </div>
  );
}
