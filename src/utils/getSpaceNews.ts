import Parser from 'rss-parser';

const parser = new Parser();

const FEEDS = [
  'https://spaceflightnow.com/feed/',
  'https://www.nasa.gov/news-release/feed/',
  'https://feeds.arstechnica.com/arstechnica/space'
];

export async function getSpaceNews(limit = 12) {
  let news: { title: string; link: string }[] = [];
  for (const feed of FEEDS) {
    try {
      const feedData = await parser.parseURL(feed);
      news = news.concat(
        (feedData.items ?? []).slice(0, limit / FEEDS.length).map(item => ({
          title: item.title ?? '',
          link: item.link ?? '#',
        }))
      );
    } catch (err) {
      console.warn(`Failed to fetch feed ${feed}:`, err.message || err);
    }
  }
  news = news.sort(() => 0.5 - Math.random()).slice(0, limit);
  return news;
}
