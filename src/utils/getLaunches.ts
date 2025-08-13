// utils/getLaunches.ts
import * as cheerio from "cheerio";

export type Launch = {
  id: string;                         // stable key for React
  name: string;                       // mission line from SFN
  window_start: string;               // raw SFN text (e.g., "NET August 14")
  window_start_display: string;       // friendly: date + time if we found one
  window_start_iso?: string | null;   // ISO only when explicit UTC/GMT time is present
  sort_ts: number | null;             // 00:00Z timestamp for ordering (even if no time)
  status: "Scheduled" | "TBD";
  stream: string | null;
  image?: string;
};

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

// Build a UTC timestamp at 00:00Z for sorting (date-only). Handles "NET ..." etc.
function buildSortTs(dateText: string): number | null {
  const cleaned = dateText
    .replace(/^No Earlier Than\s+/i, "")
    .replace(/^NET\s+/i, "")
    .replace(/\./g, "")
    .trim();

  //            1=Mon     2=Day      3=Year?
  const m = cleaned.match(/\b([A-Za-z]+)\s+(\d{1,2})(?:,)?(?:\s+(\d{4}))?/i);
  if (!m) return null;

  const monStr = (m[1] || "").toLowerCase();
  const day = Number(m[2] || 0);
  let year = m[3] ? Number(m[3]) : new Date().getUTCFullYear();
  const monthIdx = MONTHS[monStr];
  if (!Number.isFinite(monthIdx) || !day) return null;

  // If no year and month/day look >2 months in the past, assume next year.
  if (!m[3]) {
    const now = new Date();
    const diffMonths = (monthIdx - now.getUTCMonth()) + 12 * (year - now.getUTCFullYear());
    if (diffMonths < -2) year += 1;
  }

  return Date.UTC(year, monthIdx, day, 0, 0, 0);
}

// Only returns ISO when time is present AND explicitly UTC/GMT (safe for countdowns).
function tryParseISO(dateText: string, timeText?: string): string | null {
  const full = [dateText, timeText].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const saysUTC = /(?:\bUTC\b|\bGMT\b)/i.test(full);
  const cleaned = full.replace(/\./g, "");

  //            1=Mon  2=Day   3=Year?    4=hh  5=mm  6=ss?  7=tz?
  const m = cleaned.match(/\b([A-Za-z]+)\s+(\d{1,2})(?:,)?(?:\s+(\d{4}))?(?:[^0-9]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(UTC|GMT)?)?/i);
  if (!m) return null;

  const monStr = (m[1] || "").toLowerCase();
  const day = Number(m[2] || 0);
  const year = m[3] ? Number(m[3]) : new Date().getUTCFullYear();
  const hh = m[4] ? Number(m[4]) : 0;
  const mm = m[5] ? Number(m[5]) : 0;
  const ss = m[6] ? Number(m[6]) : 0;
  const tz = m[7];

  const monthIdx = MONTHS[monStr];
  if (!Number.isFinite(monthIdx) || !day) return null;

  const timePresent = !!m[4];
  const tzIsUTC = saysUTC || (tz ? /UTC|GMT/i.test(tz) : false);
  if (!timePresent || !tzIsUTC) return null;

  return new Date(Date.UTC(year, monthIdx, day, hh, mm, ss)).toISOString();
}

export async function getLaunches(): Promise<Launch[]> {
  const res = await fetch("https://spaceflightnow.com/launch-schedule/", {
    headers: {
      "user-agent": "Mozilla/5.0 (SpaceCCTV scraper)",
      "accept": "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spaceflight Now fetch failed: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const launches: Launch[] = [];

  // Your working selectors kept, plus robust time sniffing.
  $("div.datename, div.entry-content h3, div.entry-content .launchlist, div.entry-content .launchitem").each((_, el) => {
    const $block = $(el);

    const name =
      $block.find(".mission").first().text().trim() ||
      $block.find("h3").first().text().trim() ||
      $block.text().split("\n").map(s => s.trim()).filter(Boolean)[1] ||
      $block.text().split("\n").map(s => s.trim()).filter(Boolean)[0] ||
      "";

    const dateText =
      $block.find(".launchdate").first().text().trim() ||
      $block.find(".date").first().text().trim() ||
      $block.text().split("\n").map(s => s.trim()).filter(Boolean)[0] ||
      "";

    if (!name || !dateText) return;

    const sibling = $block.next();
    const nearbyText = [$block.text(), sibling.text()].join("\n");

    // Prefer explicit UTC/GMT time; otherwise any time string
    const utcTime = nearbyText.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:UTC|GMT))/i)?.[1];
    const anyTime = nearbyText.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AP]M)?(?:\s*[A-Z]{2,4})?)/i)?.[1];

    const iso = tryParseISO(dateText, utcTime ?? undefined);
    const sortTs = buildSortTs(dateText);

    // Build a nice display line for the sidebar (UTC preferred)
    const displayTime = utcTime
      ? `${dateText}, ${utcTime.replace(/\s*(UTC|GMT)\s*$/i, "")} UTC`
      : anyTime
      ? `${dateText}, ${anyTime}`
      : dateText;

    const stream =
      $block.find('a[href*="youtube.com"],a[href*="youtu.be"]').first().attr("href") ||
      sibling.find('a[href*="youtube.com"],a[href*="youtu.be"]').first().attr("href") ||
      null;

    launches.push({
      id: `${name}__${dateText}`.toLowerCase(),
      name,
      window_start: dateText,
      window_start_display: displayTime,
      window_start_iso: iso ?? null,
      sort_ts: sortTs,
      status: iso ? "Scheduled" : "TBD",
      stream,
      image: undefined,
    });
  });

  // Dedup and STABLE sort (tiebreaker by name)
  const dedup = Object.values(
    launches.reduce<Record<string, Launch>>((acc, l) => {
      if (!acc[l.id]) acc[l.id] = l;
      return acc;
    }, {})
  ).sort((a, b) => {
    const ax = a.sort_ts ?? Number.POSITIVE_INFINITY;
    const bx = b.sort_ts ?? Number.POSITIVE_INFINITY;
    if (ax !== bx) return ax - bx;
    return a.name.localeCompare(b.name);
  });

  return dedup;
}
// ---- helpers: stable sort + next upcoming ----
export function sortLaunches(list: Launch[]): Launch[] {
  // sort by sort_ts (00:00Z for date-only), then by name for stability
  return [...list].sort((a, b) => {
    const ax = a.sort_ts ?? Number.POSITIVE_INFINITY;
    const bx = b.sort_ts ?? Number.POSITIVE_INFINITY;
    if (ax !== bx) return ax - bx;
    return a.name.localeCompare(b.name);
  });
}

export function pickNextLaunch(list: Launch[]): Launch | null {
  if (!list?.length) return null;
  const sorted = sortLaunches(list);
  const now = Date.now();

  // Prefer the first item with a sort_ts in the future (or now)
  const next = sorted.find(l => typeof l.sort_ts === "number" && l.sort_ts >= now);
  return next ?? sorted[0] ?? null;
}
