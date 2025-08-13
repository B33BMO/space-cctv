// src/utils/getSpaceNews.ts
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

function ensureNodeFilePolyfill(): void {
  // Only polyfill if missing
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

export async function getSpaceNews(limit = 12): Promise<NewsItem[]> {
  // ✅ Make sure File exists BEFORE loading rss-parser
  ensureNodeFilePolyfill();

  // ✅ Dynamically import after polyfill so the lib sees File
  const { default: Parser } = await import("rss-parser");

  // Parser<FeedCustom, ItemCustom>
  const parser: InstanceType<typeof Parser<RssItem>> = new (Parser as unknown as {
    new <F = unknown, I = RssItem>(opts?: ConstructorParameters<typeof Parser>[0]): Parser<F, I>;
  })({ customFields: { item: ["contentSnippet"] } });

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Failed to fetch feed ${url}: ${msg}`);
    }
  }

  // Light shuffle then clamp
  return results.sort(() => 0.5 - Math.random()).slice(0, limit);
}
