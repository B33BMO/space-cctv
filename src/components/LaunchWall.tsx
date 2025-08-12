"use client";
import React, { useMemo, useState } from "react";
import LaunchPanel from "./LaunchPanel";
import SidebarSchedule from "./SidebarSchedule";
import type { Launch } from "@/utils/getLaunches";

function pickNextLaunch(list: Launch[]): Launch | null {
  if (!list?.length) return null;
  const sorted = [...list].sort(
    (a, b) => new Date(a.window_start).getTime() - new Date(b.window_start).getTime()
  );
  const now = Date.now();
  const upcoming = sorted.find((l) => new Date(l.window_start).getTime() >= now);
  return upcoming ?? sorted[0];
}

export default function LaunchWall({ launches }: { launches: Launch[] }) {
  const [modalStream, setModalStream] =
    useState<null | { name: string; stream: string }>(null);

  const nextLaunch = useMemo(() => pickNextLaunch(launches), [launches]);

  return (
    <main className="h-screen w-screen bg-black overflow-hidden">
      <div className="h-full w-full flex">
        <SidebarSchedule launches={launches} />
        <div className="flex-1 h-full relative overflow-hidden">
          <div className="h-full w-full flex items-center justify-center p-2">
            {nextLaunch ? (
              <div className="w-full max-w-6xl">
              <LaunchPanel
  name={nextLaunch.name}
  stream={nextLaunch.stream}
  windowStart={nextLaunch.window_start}  // <-- pass the ISO
  onStreamClick={(stream) =>
    setModalStream({ name: nextLaunch.name, stream })
  }
/>

              </div>
            ) : (
              <div className="text-white font-mono text-sm opacity-70">
                No launches found.
              </div>
            )}
          </div>
        </div>
      </div>

      {modalStream && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 cursor-zoom-out"
          onClick={() => setModalStream(null)}
        >
          <div className="w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
            <iframe
              src={modalStream.stream.replace("watch?v=", "embed/")}
              className="w-full h-full aspect-video bg-black"
              allow="autoplay; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              title={modalStream.name}
            />
          </div>
        </div>
      )}
    </main>
  );
}
