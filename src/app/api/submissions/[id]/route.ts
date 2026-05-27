import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json()

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  try {
    const submission = await prisma.submission.update({
      where: { id },
      data: { status, reviewedAt: new Date() },
      include: { location: true },
    })
    return NextResponse.json(submission)
  } catch {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }
}
