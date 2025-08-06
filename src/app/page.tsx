import { getLaunches } from "@/utils/getLaunches";
import { getSpaceNews } from "@/utils/getSpaceNews";
import LaunchWall from "@/components/LaunchWall";
import NewsTickerBar from "@/components/NewsTickerBar";

export default async function Home() {
  const launches = await getLaunches();
  const news = await getSpaceNews();

  return (
    <>
      <LaunchWall launches={launches} />
      <NewsTickerBar news={news} />
    </>
  );
}
