"use client";
import React, { useState } from "react";
import LaunchPanel from "./LaunchPanel";
import TickerBar from "./TickerBar";
import type { Launch } from "@/utils/getLaunches";

interface Launch {
  name: string;
  stream: string | null;
  image?: string | null;
  window_start?: string;
}

export default function LaunchWall({ launches }: { launches: Launch[] }) {
  const [modalStream, setModalStream] = useState<null | { name: string; stream: string }>(null);

  return (
<div className="flex-1 flex flex-col overflow-hidden pb-8">
      <div className="flex-none">
        <TickerBar launches={launches} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-black h-full">
          {launches.map((launch) => (
            <div className="h-full" key={launch.name}>
              <LaunchPanel
                name={launch.name}
                stream={launch.stream}
                onStreamClick={stream => setModalStream({ name: launch.name, stream })}
              />
            </div>
          ))}
        </div>
      </div>
 
      {modalStream && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 cursor-zoom-out"
          onClick={() => setModalStream(null)}
        >
          <div className="w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
            <iframe
              src={modalStream.stream.replace("watch?v=", "embed/")}
              className="w-full h-full aspect-video bg-black"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
