"use client";
import React from "react";
import type { Launch } from "@/utils/getLaunches";

export default function SidebarSchedule({ launches }: { launches: Launch[] }) {
  const items = [...launches].sort(
    (a, b) => new Date(a.window_start).getTime() - new Date(b.window_start).getTime()
  );

  return (
    <aside className="h-full w-64 bg-black border-r border-white/20 text-white font-mono select-none hidden sm:flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-white/20 uppercase text-xs tracking-wider">
        Schedule
      </div>
      <ul className="flex-1 overflow-y-auto pr-1">
        {items.map((l) => {
          const dt = new Date(l.window_start);
          const timeStr = dt.toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          return (
            <li
              key={`${l.name}-${l.window_start}`}
              className="px-3 py-2 border-b border-white/10 hover:bg-white/5"
              title={l.name}
            >
              <div className="text-xs text-white/80">{timeStr}</div>
              <div className="text-[11px] leading-tight line-clamp-2">{l.name}</div>
            </li>
          );
        })}
      </ul>
      <div className="px-3 py-2 border-t border-white/20 text-[10px] text-white/60">
        UTC-0 shown; browser-local time format
      </div>

      {/* hide scrollbars but keep scrollability for the sidebar only */}
      <style jsx global>{`
        aside::-webkit-scrollbar { display: none; }
        aside { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </aside>
  );
}
