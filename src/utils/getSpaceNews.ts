import Parser from "rss-parser";

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
}

declare global {
  // Polyfill globalThis.File for Node environments that lack it
  // This avoids RSS-parser crashing during Next.js server build
  // eslint-disable-next-line no-var
  var __hasFilePolyfill__: boolean | undefined;
}

if (typeof globalThis.File === "undefined" && !globalThis.__hasFilePolyfill__) {
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
  // @ts-expect-error: Assigning to globalThis
  globalThis.File = NodeFile;
  globalThis.__hasFilePolyfill__ = true;
}

export async function getSpaceNews(limit = 10): Promise<NewsItem[]> {
  const parser: Parser<unknown, NewsItem> = new Parser({
    customFields: {
      item: ["contentSnippet"],
    },
  });

  const feedUrls = [
    "https://www.nasa.gov/rss/dyn/breaking_news.rss",
    "https://www.space.com/feeds/all",
  ];

  try {
    const results: NewsItem[] = [];
    for (const url of feedUrls) {
      // @ts-expect-error: rss-parser types don't include contentSnippet
      const feed = await parser.parseURL(url);
      if (feed.items) {
        for (const item of feed.items.slice(0, limit)) {
          results.push({
            title: item.title ?? "",
            link: item.link ?? "",
            pubDate: item.pubDate ?? "",
            contentSnippet: (item as NewsItem).contentSnippet ?? "",
          });
        }
      }
    }
    return results;
  } catch (error) {
    console.error("Failed to fetch space news:", error);
    return [];
  }
}
