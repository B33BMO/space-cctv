"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  iso?: string | null;
  variant?: "badge" | "big";
  className?: string;
};

function toUtcMs(input?: string | null): number {
  if (!input) return NaN;
  let ms = Date.parse(input);
  if (!Number.isNaN(ms)) return ms;
  const isoNoZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(input);
  if (isoNoZ) {
    ms = Date.parse(input + "Z");
  }
  return Number.isNaN(ms) ? NaN : ms;
}

export default function CountdownBadge({ iso, variant = "badge", className = "" }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const targetMs = useMemo(() => toUtcMs(iso), [iso]);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!mounted || Number.isNaN(targetMs)) return;

    // clear any previous timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;

    const startDelay = 1000 - (Date.now() % 1000);
    timeoutRef.current = setTimeout(() => {
      setNowMs(Date.now());
      intervalRef.current = setInterval(() => setNowMs(Date.now()), 1000);
    }, startDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mounted, targetMs]);

  if (!mounted || Number.isNaN(targetMs)) return null;

  const diff = targetMs - nowMs;
  const past = diff < 0;
  const abs = Math.abs(diff);
  const totalSec = Math.floor(abs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const core = days > 0 ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
                        : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const label = `${past ? "T+" : "T-"} ${core}`;

  if (variant === "big") {
    return (
      <div
        className={`text-white font-mono font-bold select-none text-3xl sm:text-4xl md:text-5xl lg:text-6xl ${className}`}
        title={new Date(targetMs).toUTCString()}
        suppressHydrationWarning
      >
        {label}
      </div>
    );
  }

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
