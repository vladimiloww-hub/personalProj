import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { token } = await req.json()

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const participant = await prisma.participant.findUnique({ where: { token } })
  if (!participant) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  await prisma.participant.update({
    where: { id: participant.id },
    data: { lastSeenAt: new Date() },
  })

  const session = await getSession()
  session.sessionId = participant.id
  session.participantId = participant.id
  session.nickname = participant.nickname
  session.questUnlocked = true
  await session.save()

  return NextResponse.json({ ok: true, nickname: participant.nickname })
}
