import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!password || password !== process.env.QUEST_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const session = await getSession()
  if (!session.sessionId) {
    session.sessionId = uuidv4()
  }
  session.questUnlocked = true
  await session.save()

  return NextResponse.json({ ok: true })
}
