import type { TikTokVideo } from '@/app/mreomd/data/tiktok'

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

/** Latest videos of every creator; creators that fail to load are skipped. */
export async function fetchCreatorVideos(authors: readonly string[]): Promise<TikTokVideo[]> {
  const lists = await Promise.all(authors.map(fetchCreator))
  return lists.flat()
}
