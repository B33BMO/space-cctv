// utils/getSpaceNews.ts
import Parser from "rss-parser";

type NewsItem = { title: string; link: string };

const parser = new Parser({
  headers: {
    // Some publishers are picky about UA
    "user-agent": "SpaceCCTV/1.0 (+https://example.com)",
  },
});

// Pick stable feeds. (Removed the 404 Ars link.)
const FEEDS = [
  "https://spaceflightnow.com/feed/",
  "https://www.nasa.gov/news-release/feed/",
  "https://spacenews.com/feed/",
  "https://www.space.com/feeds/all",
  // Optional: ESA news (can be a bit broad)
  // "https://www.esa.int/rssfeed/Our_Activities",
];

function getErrMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    // @ts-ignore - best effort
    return String((err as any).message);
  }
  return String(err);
}

export async function getSpaceNews(limit = 12): Promise<NewsItem[]> {
  const items: NewsItem[] = [];

  for (const feed of FEEDS) {
    try {
      const data = await parser.parseURL(feed);
      const sliceCount = Math.max(1, Math.ceil(limit / FEEDS.length));
      const nextItems = (data.items ?? [])
        .slice(0, sliceCount)
        .map((it) => ({
          title: (it.title ?? "").trim(),
          link: (it.link ?? "#").trim(),
        }))
        .filter((x) => x.title && x.link);
      items.push(...nextItems);
    } catch (err) {
      console.warn(`Failed to fetch feed ${feed}: ${getErrMsg(err)}`);
      continue;
    }
  }

  // Dedupe by title, keep order
  const seen = new Set<string>();
  const deduped = items.filter((it) => {
    const key = it.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Shuffle a bit for variety, then cap
  const shuffled = deduped.sort(() => Math.random() - 0.5).slice(0, limit);

  return shuffled;
}
