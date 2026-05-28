import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [participants, submissionCounts] = await Promise.all([
    prisma.participant.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.submission.groupBy({ by: ['sessionId'], _count: { id: true } }),
  ])

  const countMap = Object.fromEntries(submissionCounts.map((r) => [r.sessionId, r._count.id]))

  const result = participants.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    token: p.token,
    createdAt: p.createdAt.toISOString(),
    lastSeenAt: p.lastSeenAt?.toISOString() ?? null,
    submissionCount: countMap[p.id] ?? 0,
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { nickname } = await req.json()
  if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
    return NextResponse.json({ error: 'Nickname is required' }, { status: 400 })
  }
  if (nickname.trim().length > 40) {
    return NextResponse.json({ error: 'Nickname too long' }, { status: 400 })
  }

  const token = randomBytes(24).toString('hex')
  const participant = await prisma.participant.create({
    data: { nickname: nickname.trim(), token },
  })

  return NextResponse.json({
    id: participant.id,
    nickname: participant.nickname,
    token: participant.token,
    createdAt: participant.createdAt.toISOString(),
    lastSeenAt: null,
    submissionCount: 0,
  }, { status: 201 })
}
