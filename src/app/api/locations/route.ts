import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const locations = await prisma.location.findMany({
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(locations)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, description, taskDescription, lat, lng, referencePhotoUrl, order, reward } = body

  if (!name || !description || !taskDescription || lat == null || lng == null || !referencePhotoUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const location = await prisma.location.create({
    data: { name, description, taskDescription, lat, lng, referencePhotoUrl, order: order ?? 0, reward: reward ?? '' },
  })
  return NextResponse.json(location, { status: 201 })
}
