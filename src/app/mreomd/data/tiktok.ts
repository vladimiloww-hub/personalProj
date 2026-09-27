/**
 * Videos for the TikTok feed at the bottom of every /mreomd page.
 *
 * There are no TikTok API credentials yet, so the list is static: to add a video, take the
 * number at the end of its URL (tiktok.com/@author/video/<ID>) and append it here.
 *
 * Later this can come from the Display API (/v2/video/list/ for an authorised account):
 * fetch it in a route handler with the account's access token and return the same shape,
 * then swap TIKTOK_VIDEOS for that response in TikTokFeed. The player only needs `id`.
 */
export interface TikTokVideo {
  id: string;
  author: string;
  caption?: string;
}

export const TIKTOK_VIDEOS: TikTokVideo[] = [
  {
    id: "7342876819428871430",
    author: "scoala.auto.start",
    caption: "Manevrele obligatorii la examenul auto, proba practică",
  },
  {
    id: "7345440677251108102",
    author: "scoala.auto.start",
    caption: "Situații în care poți primi RESPINS la proba practică",
  },
  {
    id: "7392196115208113441",
    author: "bdg.scoala_auto",
    caption: "Ați vrea și voi așa examene, nu? 😂",
  },
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
