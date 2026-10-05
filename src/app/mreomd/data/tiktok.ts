/**
 * Videos for the TikTok feed at the bottom of every /mreomd page.
 *
 * TikTok has no API for someone's For You feed, so the feed is built from chosen creators:
 * /api/mreomd/tiktok reads the latest videos of TIKTOK_CREATORS from their public Creator
 * Profile Embed pages and the feed shuffles them. TIKTOK_VIDEOS is a snapshot of those videos
 * (taken 2026-10-03) used as the first render and as the fallback when TikTok is unreachable.
 * To add a creator, append the name after "@" in their profile link to TIKTOK_CREATORS
 * (as { author, latest: n } to keep only their n newest videos). Single videos from creators
 * that aren't followed go to TIKTOK_PINNED and are always in the feed.
 */
export interface TikTokVideo {
  id: string;
  author: string;
  caption?: string;
}

export type TikTokCreator = string | { author: string; latest: number };

export const TIKTOK_CREATORS: TikTokCreator[] = [
  { author: "verydailydih", latest: 6 },
];

export const TIKTOK_PINNED: TikTokVideo[] = [
  { id: "7691398206936173846", author: "vincegzatz6" },
  { id: "7691761765771742486", author: "vincegzatz6" },
];

export const TIKTOK_VIDEOS: TikTokVideo[] = [
  { id: "7691975216653815062", author: "verydailydih" },
  { id: "7691805505932594454", author: "verydailydih" },
  { id: "7691725730111081750", author: "verydailydih" },
  { id: "7691671871007313174", author: "verydailydih" },
  { id: "7691605861885693206", author: "verydailydih" },
  { id: "7666789703227542806", author: "verydailydih" },
  ...TIKTOK_PINNED,
];

export function tiktokPlayerUrl(id: string) {
  const params = new URLSearchParams({
    autoplay: "0",
    loop: "0",
    controls: "1",
    progress_bar: "1",
    play_button: "1",
    volume_control: "1",
    fullscreen_button: "1",
    timestamp: "0",
    music_info: "0",
    description: "0",
    rel: "0",
    native_context_menu: "0",
    closed_caption: "1",
  });
  return `https://www.tiktok.com/player/v1/${id}?${params}`;
}

export function tiktokVideoUrl(v: TikTokVideo) {
  return `https://www.tiktok.com/@${v.author}/video/${v.id}`;
}

/** Random order that avoids two videos from the same creator in a row where possible. */
export function shuffleFeed(videos: TikTokVideo[], rnd: () => number = Math.random): TikTokVideo[] {
  const pool = [...videos];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const left = new Map<string, number>();
  for (const v of pool) left.set(v.author, (left.get(v.author) ?? 0) + 1);
  const out: TikTokVideo[] = [];
  while (pool.length) {
    // Take the creator with the most videos left (other than the previous one), so repeats
    // happen only when one creator has more than half of what's left.
    const prev = out[out.length - 1]?.author;
    let k = -1;
    pool.forEach((v, i) => {
      if (v.author !== prev && (k === -1 || left.get(v.author)! > left.get(pool[k].author)!)) k = i;
    });
    const [v] = pool.splice(k === -1 ? 0 : k, 1);
    left.set(v.author, left.get(v.author)! - 1);
    out.push(v);
  }
  return out;
}
