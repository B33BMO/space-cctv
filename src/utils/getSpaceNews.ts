// src/utils/getSpaceNews.ts
import type Parser from "rss-parser";
import type { ParserOptions } from "rss-parser";
export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
}

type RssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
};

const FEEDS = [
  "https://spaceflightnow.com/feed/",
  "https://www.nasa.gov/news-release/feed/",
  // "https://feeds.arstechnica.com/arstechnica/space", // often 404s
];

/** Minimal File polyfill for Node during Next.js server build. */
function ensureNodeFilePolyfill(): void {
  if (typeof (globalThis as { File?: unknown }).File !== "undefined") return;

  class NodeFile extends Blob implements File {
    readonly name: string;
    readonly lastModified: number;
    readonly webkitRelativePath = "";
    constructor(parts: BlobPart[], name: string, options: FilePropertyBag = {}) {
      super(parts, options);
      this.name = name;
      this.lastModified = options.lastModified ?? Date.now();
    }
    get [Symbol.toStringTag](): string {
      return "File";
    }
  }

  Object.defineProperty(globalThis, "File", {
    value: NodeFile,
    configurable: true,
    enumerable: false,
    writable: false,
  });
}

/** Instance + module shapes so TS knows what the dynamic import returns. */
type RssParserInstance = Parser<unknown, RssItem>;
type RssParserModule = {
  default: new (opts?: ParserOptions<unknown, RssItem>) => RssParserInstance;
};

/** Load and return a typed rss-parser instance after the File polyfill is in place. */
async function createParser(): Promise<RssParserInstance> {
  ensureNodeFilePolyfill();

  const { default: Parser } = (await import("rss-parser")) as RssParserModule;

  // Note: constructor is not generic; we type the instance instead.
  const parser = new Parser({
    customFields: { item: ["contentSnippet"] },
  });
  return parser;
}

/** Fetch a handful of recent space news items from multiple feeds. */
export async function getSpaceNews(limit = 12): Promise<NewsItem[]> {
  const parser = await createParser();

  const perFeed = Math.max(1, Math.ceil(limit / FEEDS.length));
  const results: NewsItem[] = [];

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url); // Output<unknown, RssItem>
      const items = (feed.items ?? []).slice(0, perFeed);
      for (const it of items) {
        results.push({
          title: it.title ?? "",
          link: it.link ?? "#",
          pubDate: it.pubDate ?? "",
          contentSnippet: it.contentSnippet ?? "",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Failed to fetch feed ${url}: ${msg}`);
    }
  }

  // Light shuffle, then clamp
  return results.sort(() => 0.5 - Math.random()).slice(0, limit);
}
