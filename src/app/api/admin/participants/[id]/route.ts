import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/session'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const withSubmissions = req.nextUrl.searchParams.get('withSubmissions') === 'true'

  if (withSubmissions) {
    await prisma.submission.deleteMany({ where: { sessionId: id } })
  }

  await prisma.participant.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
