"use client";
import React, { useMemo, useState } from "react";
import type { Launch } from "@/utils/getLaunches";
import LaunchPanel from "./LaunchPanel";
import SidebarSchedule from "./SidebarSchedule";

type Props = {
  launch: Launch | null;     // chosen on the server
  schedule?: Launch[];       // list for the sidebar
  showSidebar?: boolean;     // default true
};

export default function SingleStream({ launch, schedule = [], showSidebar = true }: Props) {
  const [modal, setModal] = useState<null | { name: string; stream: string }>(null);
  const key = useMemo(
    () => (launch ? launch.id ?? `${launch.name}__${launch.window_start}` : "nil"),
    [launch]
  );

  if (!launch) {
    return (
      <main className="h-screen w-screen grid place-items-center bg-black">
        <div className="text-white/70 font-mono">No upcoming launches found.</div>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen bg-black overflow-hidden">
      <div className={showSidebar ? "h-full w-full grid grid-cols-[16rem_1fr]" : "h-full w-full"}>
        {showSidebar && <SidebarSchedule launches={schedule} />}

        <div className="flex items-center justify-center p-2 overflow-hidden">
          {/* Big CCTV panel, keeps 16:9; bump max width if you want MOAR */}
          <div className="w-full h-full max-w-7xl aspect-video">
            <LaunchPanel
              key={key}
              name={launch.name}
              stream={launch.stream}
              windowStart={launch.window_start_iso ?? undefined}
              onStreamClick={(s) => setModal({ name: launch.name, stream: s })}
            />
          </div>
        </div>
      </div>

      {/* Click anywhere to close */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 cursor-zoom-out"
          onClick={() => setModal(null)}
        >
          <div className="w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
            <iframe
              src={modal.stream.replace("watch?v=", "embed/")}
              className="w-full h-full aspect-video bg-black"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </main>
  );
}
