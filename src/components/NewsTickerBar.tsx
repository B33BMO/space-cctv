'use client';
import React from 'react';

interface NewsItem {
  title: string;
  link: string;
}

export default function NewsTickerBar({ news }: { news: NewsItem[] }) {
  return (
    <div className="w-full bg-black py-2 border-t border-white overflow-hidden fixed bottom-0 left-0 z-40">
      <div className="relative w-full h-6">
        <div className="animate-marquee whitespace-nowrap text-white font-mono text-sm tracking-wide px-4">
          {news.map((item, i) => (
            <span key={i} className="mx-4">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {item.title}
              </a>
              {i < news.length - 1 && <span className="mx-2">•</span>}
            </span>
          ))}
          <span className="mx-4" />
          {news.map((item, i) => (
            <span key={'repeat' + i} className="mx-4">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {item.title}
              </a>
              {i < news.length - 1 && <span className="mx-2">•</span>}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        .animate-marquee {
          display: inline-block;
          animation: marquee-news 60s linear infinite;
        }
        @keyframes marquee-news {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
