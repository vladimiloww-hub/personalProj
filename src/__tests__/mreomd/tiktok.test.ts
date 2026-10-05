import { shuffleFeed, type TikTokVideo } from '@/app/mreomd/data/tiktok'
import { fetchCreatorVideos, newestVideos, parseCreatorEmbed } from '@/lib/tiktokCreators'

describe('TikTok feed', () => {
  it('reads unique video ids of the creator from an embed page', () => {
    const html = `
      <a href="https://www.tiktok.com/@cat_1/video/7688020602724142358?refer=creator_embed">
      <a href="https://www.tiktok.com/@cat_1/video/7688020602724142358">
      <a href="https://www.tiktok.com/@cat_1/video/7687800668396080387">
      <a href="https://www.tiktok.com/@other/video/7600000000000000000">`
    expect(parseCreatorEmbed(html, 'cat_1')).toEqual([
      { id: '7688020602724142358', author: 'cat_1' },
      { id: '7687800668396080387', author: 'cat_1' },
    ])
  })

  it('keeps the newest videos even when an older one is pinned first', () => {
    const v = (id: string) => ({ id, author: 'a' })
    expect(newestVideos([v('7666789703227542806'), v('7691975216653815062'), v('7691605861885693206')], 2)).toEqual([
      v('7691975216653815062'),
      v('7691605861885693206'),
    ])
  })

  it('keeps the snapshot videos of a creator TikTok does not answer for', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith('@up')
        ? new Response('<a href="https://www.tiktok.com/@up/video/7692606562854047006">')
        : new Response('overload-protect triggered', { status: 503 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    try {
      const snapshot = [{ id: '7600000000000000001', author: 'down' }, { id: '7600000000000000002', author: 'up' }]
      expect(await fetchCreatorVideos(['up', { author: 'down', latest: 12 }], snapshot)).toEqual({
        videos: [{ id: '7692606562854047006', author: 'up' }, { id: '7600000000000000001', author: 'down' }],
        live: true,
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('shuffles without losing videos and avoids repeating a creator', () => {
    const videos: TikTokVideo[] = []
    for (const a of ['a', 'b', 'c']) for (let i = 0; i < 5; i++) videos.push({ id: `${a}${i}`, author: a })
    const out = shuffleFeed(videos)
    expect(out.map((v) => v.id).sort()).toEqual(videos.map((v) => v.id).sort())
    for (let i = 1; i < out.length; i++) expect(out[i].author).not.toBe(out[i - 1].author)
  })
})
