"use client";
import React, { useEffect, useMemo, useState } from "react";

export default function CountdownBadge({ iso }: { iso?: string }) {
  const target = useMemo(() => (iso ? new Date(iso) : null), [iso]);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!target) return null;

  const diffMs = target.getTime() - now.getTime(); // future => +
  const past = diffMs < 0;
  const abs = Math.abs(diffMs);

  const totalSeconds = Math.floor(abs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const core = days > 0
    ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const label = `${past ? "T+" : "T-"} ${core}`;

  return (
    <div
      className="bg-black/80 text-white font-mono text-[11px] px-2 py-1 border border-white/20"
      title={target.toUTCString()}
    >
      {label}
    </div>
  );
}
