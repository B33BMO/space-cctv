// src/utils/getSpaceNews.ts
// Zero-dependency, server-safe RSS fetching. No DOM/File required.

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
}

const FEEDS = [
  "https://spaceflightnow.com/feed/",
  "https://www.nasa.gov/news-release/feed/",
  // "https://feeds.arstechnica.com/arstechnica/space", // often 404s
];

// --- helpers ---------------------------------------------------------------

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function textBetween(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : null;
}

function parseItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = stripTags(textBetween(block, "title") ?? "");
    // Prefer <link> if present, fall back to <guid isPermaLink="true">
    const link =
      stripTags(textBetween(block, "link") ?? "") ||
      (block.match(/<guid[^>]*isPermaLink=["']true["'][^>]*>([\s\S]*?)<\/guid>/i)?.[1] ?? "")
        .trim();
    const pubDate = stripTags(textBetween(block, "pubDate") ?? "");
    const snippet =
      stripTags(textBetween(block, "description") ?? "") ||
      stripTags(textBetween(block, "content:encoded") ?? "");

    if (title) {
      items.push({
        title,
        link: link || "#",
        pubDate,
        contentSnippet: snippet.slice(0, 240),
      });
    }
  }
  return items;
}

// --- main API --------------------------------------------------------------

export async function getSpaceNews(limit = 12): Promise<NewsItem[]> {
  const perFeed = Math.max(1, Math.ceil(limit / FEEDS.length));
  let out: NewsItem[] = [];

  for (const url of FEEDS) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        console.warn(`Failed to fetch feed ${url}: ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const items = parseItems(xml).slice(0, perFeed);
      out = out.concat(items);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Failed to fetch feed ${url}: ${msg}`);
    }
  }

  // light shuffle for variety, then clamp
  return out.sort(() => 0.5 - Math.random()).slice(0, limit);
}
