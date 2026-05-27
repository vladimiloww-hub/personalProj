import prisma from '@/lib/db'
import { QrDisplay } from '@/components/admin/QrDisplay'
import { LocationManager } from '@/components/admin/LocationManager'
import { SubmissionReview } from '@/components/admin/SubmissionReview'
import { ProgressTable } from '@/components/admin/ProgressTable'
import { SvgDivider } from '@/components/ui/SvgDivider'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [locations, submissionsRaw, progressRaw] = await Promise.all([
    prisma.location.findMany({ orderBy: { order: 'asc' } }),
    prisma.submission.findMany({
      include: { location: true },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.submission.findMany({ select: { sessionId: true, status: true } }),
  ])

  const serializedLocations = locations.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }))

  const serializedSubmissions = submissionsRaw.map((s) => ({
    ...s,
    submittedAt: s.submittedAt.toISOString(),
    reviewedAt: s.reviewedAt?.toISOString() ?? null,
    location: {
      ...s.location,
      createdAt: s.location.createdAt.toISOString(),
    },
  }))

  // Build progress by session
  const bySession: Record<string, { pending: number; approved: number; rejected: number; total: number }> = {}
  for (const s of progressRaw) {
    if (!bySession[s.sessionId]) bySession[s.sessionId] = { pending: 0, approved: 0, rejected: 0, total: 0 }
    bySession[s.sessionId].total++
    bySession[s.sessionId][s.status.toLowerCase() as 'pending' | 'approved' | 'rejected']++
  }
  const progressEntries = Object.entries(bySession).map(([sessionId, counts]) => ({ sessionId, ...counts }))

  return (
    <div className="space-y-8 py-6">
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-cinzel)] text-xl text-[#e8dcc8] tracking-wide">
          Quest Master
        </h1>
        <p className="font-[family-name:var(--font-im-fell)] text-[#8a7a64] text-sm italic mt-1">
          Manage the trials of Budapest
        </p>
      </div>

      <SvgDivider />

      <QrDisplay />

      <SvgDivider />

      <LocationManager initialLocations={serializedLocations} />

      <SvgDivider />

      <SubmissionReview initialSubmissions={serializedSubmissions} />

      <SvgDivider />

      <ProgressTable entries={progressEntries} />
    </div>
  )
}
