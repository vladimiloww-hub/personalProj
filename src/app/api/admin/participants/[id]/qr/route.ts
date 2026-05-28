import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const participant = await prisma.participant.findUnique({ where: { id } })
  if (!participant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/?token=${participant.token}`
  const png = await QRCode.toBuffer(url, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#191713', light: '#d4cdbc' },
  })

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(participant.nickname)}-qr.png"`,
    },
  })
}
