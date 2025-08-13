"use client";
import React from "react";
import type { Launch } from "@/utils/getLaunches";

function formatUTC(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBD";
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${M[d.getUTCMonth()]} ${pad(d.getUTCDate())}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export default function SidebarSchedule({ launches }: { launches: Launch[] }) {
  const items = [...launches].sort((a, b) => {
    const ta = typeof a.sort_ts === "number" ? a.sort_ts
             : a.window_start_iso ? Date.parse(a.window_start_iso)
             : Number.POSITIVE_INFINITY;
    const tb = typeof b.sort_ts === "number" ? b.sort_ts
             : b.window_start_iso ? Date.parse(b.window_start_iso)
             : Number.POSITIVE_INFINITY;
    return ta - tb;
  });

  return (
    <aside className="sfn-sidebar h-full w-64 bg-black border-r border-white/20 text-white font-mono select-none hidden sm:flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-white/20 uppercase text-xs tracking-wider">
        Schedule
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-white/60 text-xs px-3">
          No launches found.
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto pr-1">
          {items.map((l) => {
            const isNET = /^NET\b/i.test(l.window_start);
            const when = l.window_start_iso ? formatUTC(l.window_start_iso) : l.window_start_display || l.window_start;
            return (
              <li
                key={`${l.name}__${l.window_start}`}
                className="px-3 py-2 border-b border-white/10 hover:bg-white/5"
                title={l.name}
              >
                <div className="flex items-center gap-2 text-xs text-white/80">
                  {isNET && (
                    <span className="border border-white/30 px-1 py-[1px] text-[10px] tracking-wider">
                      NET
                    </span>
                  )}
                  <span>{when}</span>
                </div>
                <div className="text-[11px] leading-tight line-clamp-2 mt-0.5">{l.name}</div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="px-3 py-2 border-t border-white/20 text-[10px] text-white/60">
        UTC shown when published; otherwise the site’s listed time.
      </div>

      <style jsx global>{`
        .sfn-sidebar ul::-webkit-scrollbar { display: none; }
        .sfn-sidebar ul { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </aside>
  );
}
