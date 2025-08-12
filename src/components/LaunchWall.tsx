"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import LaunchPanel from "./LaunchPanel";
import SidebarSchedule from "./SidebarSchedule";
import type { Launch } from "@/utils/getLaunches";

export default function LaunchWall({ launches }: { launches: Launch[] }) {
  const wallRef = useRef<HTMLDivElement | null>(null);
  const [cols, setCols] = useState<number>(Math.min(4, Math.max(1, launches.length)));

  // Compute the best column count so rows fit within the wall's height
  useEffect(() => {
    if (!wallRef.current) return;

    const GAP = 1; // px, matches gap-px
    const RATIO = 16 / 9;

    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      const W = Math.floor(cr.width);
      const H = Math.floor(cr.height);
      if (!W || !H) return;

      // Try from max columns down to 1 to find the largest that fits
      const maxCols = Math.min(6, launches.length || 1); // cap for sanity
      let chosen = 1;

      for (let c = maxCols; c >= 1; c--) {
        const colGaps = (c - 1) * GAP;
        const tileW = (W - colGaps) / c;
        const tileH = tileW / RATIO;

        const rows = Math.ceil((launches.length || 1) / c);
        const rowGaps = (rows - 1) * GAP;
        const totalH = rows * tileH + rowGaps;

        if (totalH <= H) {
          chosen = c;
          break;
        }
      }

      setCols(chosen);
    });

    ro.observe(wallRef.current);
    return () => ro.disconnect();
  }, [launches.length]);

  const gridStyle = useMemo<React.CSSProperties>(
    () => ({ gridTemplateColumns: `repeat(${cols}, 1fr)` }),
    [cols]
  );

  return (
    <main className="h-screen w-screen bg-black overflow-hidden">
      <div className="h-full w-full flex">
        {/* Sidebar */}
        <SidebarSchedule launches={launches} />

        {/* CCTV wall area measured by ResizeObserver */}
        <div ref={wallRef} className="flex-1 h-full relative overflow-hidden">
          <div
            className="h-full w-full grid gap-px bg-black place-content-start"
            style={gridStyle}
          >
            {launches.map((launch) => (
              <div className="h-full" key={launch.name}>
                <LaunchPanel
                  name={launch.name}
                  stream={launch.stream}
                  onStreamClick={(stream) =>
                    /* your modal setter in parent if needed */
                    console.log("open modal with", stream)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
