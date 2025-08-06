// utils/getLaunches.ts

export type Launch = {
  name: string;
  window_start: string;
  status: string;
  stream: string | null;
  image?: string;
};

type ApiLaunch = {
  name: string;
  window_start: string;
  status: { name: string };
  vidURLs?: string[];
  image?: string;
};

export async function getLaunches(): Promise<Launch[]> {
  const res = await fetch('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10');
  const data = await res.json();
  return data.results.map((launch: ApiLaunch): Launch => ({
    name: launch.name,
    window_start: launch.window_start,
    status: launch.status.name,
    stream: Array.isArray(launch.vidURLs) && launch.vidURLs.length > 0 ? launch.vidURLs[0] : null,
    image: launch.image,
  }));
}
