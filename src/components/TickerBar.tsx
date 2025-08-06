'use client';
import React from 'react';

interface Launch {
  name: string;
  window_start: string;
}

export default function TickerBar({ launches }: { launches: Launch[] }) {
  const items = launches.map(l => {
    const dt = new Date(l.window_start);
    const timeStr = dt.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${timeStr} | ${l.name}`;
  });

  return (
    <div className="w-full bg-black py-2 border-b border-white overflow-hidden">
      <div className="relative w-full h-6">
        <div className="animate-marquee whitespace-nowrap text-white font-mono text-sm tracking-wide px-4">
          {items.join('   •   ')}
          <span className="mx-4" />
          {items.join('   •   ')}
        </div>
      </div>
      <style>{`
        .animate-marquee {
          display: inline-block;
          animation: marquee 60s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
