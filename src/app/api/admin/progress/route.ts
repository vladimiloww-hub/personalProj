import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const submissions = await prisma.submission.findMany({
    select: { sessionId: true, status: true },
  })

  const bySession: Record<string, { pending: number; approved: number; rejected: number; total: number }> = {}
  for (const s of submissions) {
    if (!bySession[s.sessionId]) {
      bySession[s.sessionId] = { pending: 0, approved: 0, rejected: 0, total: 0 }
    }
    bySession[s.sessionId].total++
    bySession[s.sessionId][s.status.toLowerCase() as 'pending' | 'approved' | 'rejected']++
  }

  const result = Object.entries(bySession).map(([sessionId, counts]) => ({ sessionId, ...counts }))
  return NextResponse.json(result)
}
