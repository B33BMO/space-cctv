"use client";
import React, { useEffect, useRef } from "react";

type Props = {
  fps?: number;           // animation rate
  className?: string;     // extra classes (positioning)
  opacity?: number;       // 0..1 noise opacity
  overscan?: number;      // extra drawn area around edges (e.g. 0.08 = 8%)
  jitter?: number;        // px jitter range
};

export default function SignalStatic({
  fps = 24,
  className = "",
  opacity = 0.85,
  overscan = 0.08,
  jitter = 2,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const visRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    let width = 0, height = 0;
    const frameMs = Math.max(1000 / fps, 16);
    let last = 0;

    // offscreen buffer for overscan + jitter
    const buf = document.createElement("canvas");
    const btx = buf.getContext("2d", { alpha: true })!;

    let bw = 0, bh = 0;        // buffer size (with overscan)
    let scanY = 0;             // rolling bar position

    const resize = () => {
      const parent = canvas.parentElement!;
      const rect = parent.getBoundingClientRect();

      width  = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));

      // main canvas
      canvas.width  = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // overscan buffer (a bit bigger than target)
      bw = Math.max(1, Math.floor(width  * (1 + overscan * 2)));
      bh = Math.max(1, Math.floor(height * (1 + overscan * 2)));
      buf.width = Math.floor(bw * dpr);
      buf.height = Math.floor(bh * dpr);
      btx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const io = new IntersectionObserver(
      (entries) => { visRef.current = entries[0]?.isIntersecting ?? true; },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (now: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (!visRef.current || prefersReduced) return;
      if (now - last < frameMs) return;
      last = now;

      // --- generate noise into buffer ---
      const img = btx.createImageData(bw, bh);
      const data = img.data;

      // random grayscale
      const alpha = Math.floor(255 * opacity);
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = v;       // R
        data[i + 1] = v;   // G
        data[i + 2] = v;   // B
        data[i + 3] = alpha;
      }

      // scanlines every 3px
      for (let y = 0; y < bh; y += 3) {
        for (let x = 0; x < bw; x++) {
          const idx = ((y * bw) + x) * 4 + 3;
          data[idx] = Math.max(0, data[idx] - 30);
        }
      }

      // rolling brighter bar
      scanY = (scanY + Math.max(1, Math.round(bh * 0.004))) % bh;
      const barH = Math.max(2, Math.floor(bh * 0.06));
      for (let y = scanY; y < scanY + barH; y++) {
        const yy = y % bh;
        for (let x = 0; x < bw; x++) {
          const base = ((yy * bw) + x) * 4;
          const boost = 35;
          data[base]     = Math.min(255, data[base]     + boost);
          data[base + 1] = Math.min(255, data[base + 1] + boost);
          data[base + 2] = Math.min(255, data[base + 2] + boost);
        }
      }

      btx.putImageData(img, 0, 0);

      // --- draw buffer to main canvas with tiny jitter & crop (overscan effect) ---
      const jx = (Math.random() * (jitter * 2) - jitter) | 0;
      const jy = (Math.random() * (jitter * 2) - jitter) | 0;

      // source rectangle centered with overscan margin, then nudged by jitter
      const marginX = Math.floor((bw - width) / 2);
      const marginY = Math.floor((bh - height) / 2);
      const sx = Math.max(0, Math.min(bw - width, marginX + jx));
      const sy = Math.max(0, Math.min(bh - height, marginY + jy));

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(buf, sx, sy, width, height, 0, 0, width, height);
    };

    const onVis = () => { last = 0; };
    document.addEventListener("visibilitychange", onVis);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fps, opacity, overscan, jitter]);

  // Ensure canvas covers its container entirely
  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
    />
  );
}
