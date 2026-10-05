/**
 * Videos for the TikTok feed at the bottom of every /mreomd page.
 *
 * TikTok has no API for someone's For You feed, so the feed is built from chosen creators:
 * /api/mreomd/tiktok reads the latest videos of TIKTOK_CREATORS from their public Creator
 * Profile Embed pages and the feed shuffles them. TIKTOK_VIDEOS is a snapshot of those videos
 * (taken 2026-10-05) used as the first render and as the fallback when TikTok is unreachable.
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
  { author: "emotiguy", latest: 12 },
  { author: "grezava", latest: 12 },
  { author: "funnycats128362", latest: 12 },
  { author: "nerozeroborn", latest: 12 },
  { author: "kingdavid1095", latest: 12 },
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
  { id: "7693231506436689160", author: "emotiguy" },
  { id: "7692490755943779592", author: "emotiguy" },
  { id: "7691747152342682887", author: "emotiguy" },
  { id: "7691469681315663112", author: "emotiguy" },
  { id: "7690646476975770888", author: "emotiguy" },
  { id: "7689889734809701640", author: "emotiguy" },
  { id: "7689518706434542855", author: "emotiguy" },
  { id: "7689147902102441234", author: "emotiguy" },
  { id: "7688780054783905032", author: "emotiguy" },
  { id: "7626429852920417544", author: "emotiguy" },
  { id: "7562205148152483079", author: "emotiguy" },
  { id: "7690587166946200840", author: "grezava" },
  { id: "7682884095004724498", author: "grezava" },
  { id: "7681381553481452807", author: "grezava" },
  { id: "7672839177393802514", author: "grezava" },
  { id: "7672839061580582162", author: "grezava" },
  { id: "7672839042232356104", author: "grezava" },
  { id: "7672475081120959752", author: "grezava" },
  { id: "7672475036258684168", author: "grezava" },
  { id: "7671754383545142535", author: "grezava" },
  { id: "7671754317409357063", author: "grezava" },
  { id: "7640518736788589842", author: "grezava" },
  { id: "7534083338403974456", author: "grezava" },
  { id: "7692606562854047006", author: "funnycats128362" },
  { id: "7689667590548884766", author: "funnycats128362" },
  { id: "7686866539982933278", author: "funnycats128362" },
  { id: "7686865868562664735", author: "funnycats128362" },
  { id: "7686495313904831775", author: "funnycats128362" },
  { id: "7686494803713969438", author: "funnycats128362" },
  { id: "7686123508723617055", author: "funnycats128362" },
  { id: "7686122898762845471", author: "funnycats128362" },
  { id: "7685966214144740639", author: "funnycats128362" },
  { id: "7685964789142523166", author: "funnycats128362" },
  { id: "7685963898813467935", author: "funnycats128362" },
  { id: "7685491835472481566", author: "funnycats128362" },
  { id: "7692939317869694228", author: "nerozeroborn" },
  { id: "7692575766726348052", author: "nerozeroborn" },
  { id: "7692165732259368212", author: "nerozeroborn" },
  { id: "7691437697902120213", author: "nerozeroborn" },
  { id: "7690974269379071252", author: "nerozeroborn" },
  { id: "7690943354372115733", author: "nerozeroborn" },
  { id: "7690720249565449492", author: "nerozeroborn" },
  { id: "7690004325141204245", author: "nerozeroborn" },
  { id: "7689956733577465108", author: "nerozeroborn" },
  { id: "7692949145111252230", author: "kingdavid1095" },
  { id: "7692948338630462727", author: "kingdavid1095" },
  { id: "7687993525882932498", author: "kingdavid1095" },
  { id: "7687961099655843079", author: "kingdavid1095" },
  { id: "7687894604133338386", author: "kingdavid1095" },
  { id: "7687893707470720274", author: "kingdavid1095" },
  { id: "7686897418599812370", author: "kingdavid1095" },
  { id: "7685775405009145096", author: "kingdavid1095" },
  { id: "7685737085168307474", author: "kingdavid1095" },
  { id: "7685736802228915474", author: "kingdavid1095" },
  { id: "7672723139759082770", author: "kingdavid1095" },
  { id: "7670845636337618194", author: "kingdavid1095" },
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
