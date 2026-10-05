import type { TikTokCreator, TikTokVideo } from '@/app/mreomd/data/tiktok'

const USERNAME = /^[A-Za-z0-9._]{2,24}$/

/** Video ids linked from a TikTok Creator Profile Embed page (tiktok.com/embed/@user), newest first as listed. */
export function parseCreatorEmbed(html: string, author: string): TikTokVideo[] {
  const escaped = author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`@${escaped}/video/(\\d{15,20})`, 'g')
  const seen = new Set<string>()
  const out: TikTokVideo[] = []
  for (const m of html.matchAll(re)) {
    if (seen.has(m[1])) continue
    seen.add(m[1])
    out.push({ id: m[1], author })
  }
  return out
}

async function fetchCreator(author: string): Promise<TikTokVideo[]> {
  if (!USERNAME.test(author)) return []
  try {
    const res = await fetch(`https://www.tiktok.com/embed/@${author}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MREO.md feed)' },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    })
    if (!res.ok) return []
    return parseCreatorEmbed(await res.text(), author)
  } catch {
    return []
  }
}

/** Newest `n` videos; ids grow with upload time, so this skips pinned older videos too. */
export function newestVideos(videos: TikTokVideo[], n: number): TikTokVideo[] {
  return [...videos].sort((a, b) => (BigInt(b.id) > BigInt(a.id) ? 1 : -1)).slice(0, n)
}

async function fetchCreatorEntry(creator: TikTokCreator): Promise<TikTokVideo[]> {
  if (typeof creator === 'string') return fetchCreator(creator)
  return newestVideos(await fetchCreator(creator.author), creator.latest)
}

/**
 * Latest videos of every creator. A creator TikTok doesn't answer for (it rate-limits embed
 * pages now and then) keeps their videos from `fallback`; `live` is true when any creator loaded.
 */
export async function fetchCreatorVideos(
  creators: readonly TikTokCreator[],
  fallback: readonly TikTokVideo[] = [],
): Promise<{ videos: TikTokVideo[]; live: boolean }> {
  let live = false
  const lists = await Promise.all(
    creators.map(async (creator) => {
      const videos = await fetchCreatorEntry(creator)
      if (videos.length > 0) {
        live = true
        return videos
      }
      const author = typeof creator === 'string' ? creator : creator.author
      return fallback.filter((v) => v.author === author)
    }),
  )
  return { videos: lists.flat(), live }
}
