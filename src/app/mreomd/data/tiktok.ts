/**
 * Videos for the TikTok feed at the bottom of every /mreomd page.
 *
 * TikTok has no API for someone's For You feed, so the feed is built from chosen creators:
 * /api/mreomd/tiktok reads the latest videos of TIKTOK_CREATORS from their public Creator
 * Profile Embed pages and the feed shuffles them. TIKTOK_VIDEOS is a snapshot of those videos
 * (taken 2026-09-27) used as the first render and as the fallback when TikTok is unreachable.
 * To add a creator, append the name after "@" in their profile link to TIKTOK_CREATORS.
 */
export interface TikTokVideo {
  id: string;
  author: string;
  caption?: string;
}

export const TIKTOK_CREATORS = [
  "heart_of_black_cat_",
  "ibhanoxyennen",
  "mabletheangel",
  "ai_giorgis",
  "qyupiemayo",
  "mafanyatwitch",
];

export const TIKTOK_VIDEOS: TikTokVideo[] = [
  { id: "7615293124176284935", author: "heart_of_black_cat_" },
  { id: "7689126695533677831", author: "heart_of_black_cat_" },
  { id: "7678018855402245384", author: "heart_of_black_cat_" },
  { id: "7674647023815068946", author: "heart_of_black_cat_" },
  { id: "7672457604727065863", author: "heart_of_black_cat_" },
  { id: "7670255910610160903", author: "heart_of_black_cat_" },
  { id: "7666594576634825991", author: "heart_of_black_cat_" },
  { id: "7664286096880110856", author: "heart_of_black_cat_" },
  { id: "7660604159606983943", author: "heart_of_black_cat_" },
  { id: "7658721748795329810", author: "heart_of_black_cat_" },
  { id: "7656130104589896978", author: "heart_of_black_cat_" },
  { id: "7666117137504767250", author: "ibhanoxyennen" },
  { id: "7649803238148951303", author: "ibhanoxyennen" },
  { id: "7628312093548219655", author: "ibhanoxyennen" },
  { id: "7690226970784713992", author: "ibhanoxyennen" },
  { id: "7690215122127637767", author: "ibhanoxyennen" },
  { id: "7690155480378821896", author: "ibhanoxyennen" },
  { id: "7690154656214895880", author: "ibhanoxyennen" },
  { id: "7690144609338674450", author: "ibhanoxyennen" },
  { id: "7690128101325475080", author: "ibhanoxyennen" },
  { id: "7690127684134915346", author: "ibhanoxyennen" },
  { id: "7690127215480081671", author: "ibhanoxyennen" },
  { id: "7690124127016930568", author: "ibhanoxyennen" },
  { id: "7690105762181434642", author: "ibhanoxyennen" },
  { id: "7681040433429892374", author: "mabletheangel" },
  { id: "7664015710531636502", author: "mabletheangel" },
  { id: "7659566431159192854", author: "mabletheangel" },
  { id: "7689953514998484246", author: "mabletheangel" },
  { id: "7689926482386373910", author: "mabletheangel" },
  { id: "7688121458421222678", author: "mabletheangel" },
  { id: "7688080422672125206", author: "mabletheangel" },
  { id: "7688020602724142358", author: "mabletheangel" },
  { id: "7687800668396080387", author: "mabletheangel" },
  { id: "7687770703260699926", author: "mabletheangel" },
  { id: "7687736260370205974", author: "mabletheangel" },
  { id: "7687725682402626838", author: "mabletheangel" },
  { id: "7687705883698122006", author: "mabletheangel" },
  { id: "7684269469404859670", author: "ai_giorgis" },
  { id: "7684264482708950295", author: "ai_giorgis" },
  { id: "7686879609387830550", author: "ai_giorgis" },
  { id: "7690197214483811606", author: "ai_giorgis" },
  { id: "7690160881547611414", author: "ai_giorgis" },
  { id: "7690091439983693078", author: "ai_giorgis" },
  { id: "7689818968676125974", author: "ai_giorgis" },
  { id: "7689741609457454358", author: "ai_giorgis" },
  { id: "7689489372390935830", author: "ai_giorgis" },
  { id: "7689486360851270934", author: "ai_giorgis" },
  { id: "7689067961323392278", author: "ai_giorgis" },
  { id: "7689038465987628310", author: "ai_giorgis" },
  { id: "7689013533933161750", author: "ai_giorgis" },
  { id: "7683555656820886797", author: "qyupiemayo" },
  { id: "7668715678119120159", author: "qyupiemayo" },
  { id: "7677281072802991373", author: "qyupiemayo" },
  { id: "7687954157730319646", author: "qyupiemayo" },
  { id: "7685784897310444831", author: "qyupiemayo" },
  { id: "7685510357355400478", author: "qyupiemayo" },
  { id: "7685125685265911054", author: "qyupiemayo" },
  { id: "7684778073069276446", author: "qyupiemayo" },
  { id: "7683924183071427854", author: "qyupiemayo" },
  { id: "7682827433388625165", author: "qyupiemayo" },
  { id: "7682444733746056478", author: "qyupiemayo" },
  { id: "7682170466626211085", author: "qyupiemayo" },
  { id: "7689567878110088449", author: "mafanyatwitch" },
  { id: "7689094553122376966", author: "mafanyatwitch" },
  { id: "7688021496245046529", author: "mafanyatwitch" },
  { id: "7687749448641957137", author: "mafanyatwitch" },
  { id: "7687639951940259088", author: "mafanyatwitch" },
  { id: "7686219973747838209", author: "mafanyatwitch" },
  { id: "7685418332387822849", author: "mafanyatwitch" },
  { id: "7685355659251944721", author: "mafanyatwitch" },
  { id: "7685107600974728464", author: "mafanyatwitch" },
  { id: "7683899574397766928", author: "mafanyatwitch" },
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
  const out: TikTokVideo[] = [];
  while (pool.length) {
    const prev = out[out.length - 1]?.author;
    const k = pool.findIndex((v) => v.author !== prev);
    out.push(...pool.splice(k === -1 ? 0 : k, 1));
  }
  return out;
}
