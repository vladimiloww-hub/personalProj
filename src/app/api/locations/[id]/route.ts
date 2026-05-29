import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { name, description, taskDescription, lat, lng, referencePhotoUrl, order, reward } = body

  try {
    const location = await prisma.location.update({
      where: { id },
      data: { name, description, taskDescription, lat, lng, referencePhotoUrl, order, reward },
    })
    return NextResponse.json(location)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    await prisma.location.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  }
}
