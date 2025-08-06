import React from "react";
import Image from "next/image";

interface Props {
  name: string;
  stream: string | null;
  onStreamClick?: (stream: string) => void;
}

export default function LaunchPanel({ name, stream, onStreamClick }: Props) {
  return (
    <div className="bg-black border border-black overflow-hidden flex flex-col h-full">
      <div className="aspect-video w-full bg-black relative">
        {stream ? (
          <div
            className="w-full h-full cursor-zoom-in"
            onClick={() => onStreamClick?.(stream)}
            tabIndex={0}
            role="button"
            title="Click to maximize"
          >
            <iframe
              src={stream.replace("watch?v=", "embed/")}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full bg-black relative">
            <Image
              src="/tv-static.gif"
              alt="Static"
              fill
              className="object-cover opacity-70"
              priority
            />
            <span className="z-10 text-white text-xl font-mono font-bold bg-black/90 px-3 py-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
  {'//Error: Stream Unavailable.'}
</span>

          </div>
        )}
      </div>
      <div className="p-2 bg-black border-t border-black">
        <span className="font-mono font-bold text-white text-xs">{name}</span>
      </div>
    </div>
  );
}
