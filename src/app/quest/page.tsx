import { requireQuestSession } from '@/lib/auth'
import prisma from '@/lib/db'
import { GothicHeader } from '@/components/layout/GothicHeader'
import { QuestBoard } from '@/components/quest/QuestBoard'
import { SvgDivider } from '@/components/ui/SvgDivider'

export const dynamic = 'force-dynamic'

export default async function QuestPage() {
  const session = await requireQuestSession()

  const [locations, submissions] = await Promise.all([
    prisma.location.findMany({ orderBy: { order: 'asc' } }),
    prisma.submission.findMany({ where: { sessionId: session.sessionId } }),
  ])

  const serializedSubmissions = submissions.map((s) => ({
    ...s,
    submittedAt: s.submittedAt.toISOString(),
    reviewedAt: s.reviewedAt?.toISOString() ?? null,
  }))

  const serializedLocations = locations.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }))

  return (
    <main className="min-h-dvh flex flex-col">
      <GothicHeader subtitle="Traverse · Discover · Prove" />

      <SvgDivider className="px-4 max-w-sm mx-auto mb-6" />

      <QuestBoard
        locations={serializedLocations}
        initialSubmissions={serializedSubmissions}
      />
    </main>
  )
}
