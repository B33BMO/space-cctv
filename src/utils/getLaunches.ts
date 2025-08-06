// utils/getLaunches.ts
export async function getLaunches() {
    const res = await fetch('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10');
    const data = await res.json();
    // Each launch has a vidURLs array under .vidURLs
    return data.results.map((launch: any) => ({
      name: launch.name,
      window_start: launch.window_start,
      status: launch.status.name,
      stream: launch.vidURLs?.[0] || null,
      image: launch.image,
    }));
  }
  