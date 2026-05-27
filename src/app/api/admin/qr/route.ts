import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/?password=${process.env.QUEST_PASSWORD}`
  const png = await QRCode.toBuffer(url, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#0f0d0a', light: '#e8dcc8' },
  })

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  })
}
