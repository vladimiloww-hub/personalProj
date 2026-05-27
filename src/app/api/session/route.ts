import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  return NextResponse.json({
    sessionId: session.sessionId ?? null,
    questUnlocked: session.questUnlocked ?? false,
    isAdmin: session.isAdmin ?? false,
  })
}
