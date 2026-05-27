import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'
import { uploadPhoto } from '@/lib/blob'

export async function GET() {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const submissions = await prisma.submission.findMany({
    include: { location: true },
    orderBy: { submittedAt: 'desc' },
  })
  return NextResponse.json(submissions)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.questUnlocked || !session.sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const locationId = formData.get('locationId') as string
  const file = formData.get('file') as File | null

  if (!locationId || !file) {
    return NextResponse.json({ error: 'Missing locationId or file' }, { status: 400 })
  }

  const existing = await prisma.submission.findUnique({
    where: { locationId_sessionId: { locationId, sessionId: session.sessionId } },
  })

  if (existing?.status === 'APPROVED') {
    return NextResponse.json({ error: 'Already completed' }, { status: 409 })
  }
  if (existing?.status === 'PENDING') {
    return NextResponse.json({ error: 'Already pending review' }, { status: 409 })
  }

  const photoUrl = await uploadPhoto(file, 'submissions')

  const submission = await prisma.submission.upsert({
    where: { locationId_sessionId: { locationId, sessionId: session.sessionId } },
    update: { photoUrl, status: 'PENDING', reviewedAt: null },
    create: { locationId, sessionId: session.sessionId, photoUrl, status: 'PENDING' },
  })

  return NextResponse.json(submission, { status: 201 })
}
