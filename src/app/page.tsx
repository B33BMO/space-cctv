// app/page.tsx
import { getLaunches } from "@/utils/getLaunches";
import SingleStream from "@/components/SingleStream";

export default async function Home() {
  const launches = await getLaunches();

  // stable sort (same logic as utils) — server-side to avoid hydration drift
  const sorted = [...launches].sort((a, b) => {
    const ax = a.sort_ts ?? Number.POSITIVE_INFINITY;
    const bx = b.sort_ts ?? Number.POSITIVE_INFINITY;
    if (ax !== bx) return ax - bx;
    return a.name.localeCompare(b.name);
  });

  const now = Date.now();
  const nextLaunch =
    sorted.find(l => typeof l.sort_ts === "number" && l.sort_ts >= now) ??
    sorted[0] ??
    null;

  return (
    <SingleStream
      launch={nextLaunch}
      schedule={sorted}
      showSidebar={true} // set false for pure fullscreen
    />
  );
}
