import { TIKTOK_CREATORS, TIKTOK_PINNED, TIKTOK_VIDEOS, type TikTokVideo } from '@/app/mreomd/data/tiktok'
import { fetchCreatorVideos } from '@/lib/tiktokCreators'

export const dynamic = 'force-dynamic'

const TTL_MS = 6 * 60 * 60 * 1000
let cache: { at: number; videos: TikTokVideo[] } | null = null

/**
 * Latest videos of the feed's creators, refreshed at most every 6 hours per server instance.
 * Falls back to the snapshot in data/tiktok.ts when TikTok can't be reached.
 * Access is checked by src/proxy.ts like the rest of /api/mreomd.
 */
export async function GET() {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    const fresh = await fetchCreatorVideos(TIKTOK_CREATORS)
    if (fresh.length > 0) cache = { at: Date.now(), videos: [...fresh, ...TIKTOK_PINNED] }
  }
  return Response.json(
    { videos: cache?.videos ?? TIKTOK_VIDEOS, live: Boolean(cache) },
    { headers: { 'Cache-Control': 'private, max-age=600' } },
  )
}
