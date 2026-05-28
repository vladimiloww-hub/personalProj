import prisma from '@/lib/db'
import { ParticipantManager } from '@/components/admin/ParticipantManager'
import { QrDisplay } from '@/components/admin/QrDisplay'
import { LocationManager } from '@/components/admin/LocationManager'
import { SubmissionReview } from '@/components/admin/SubmissionReview'
import { ProgressTable } from '@/components/admin/ProgressTable'
import { SvgDivider } from '@/components/ui/SvgDivider'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [locations, submissionsRaw, progressRaw, participants] = await Promise.all([
    prisma.location.findMany({ orderBy: { order: 'asc' } }),
    prisma.submission.findMany({
      include: { location: true },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.submission.findMany({ select: { sessionId: true, status: true } }),
    prisma.participant.findMany({ orderBy: { createdAt: 'asc' } }),
  ])

  // Build nickname map: participant.id → nickname
  const nicknameMap: Record<string, string> = Object.fromEntries(
    participants.map((p) => [p.id, p.nickname])
  )

  // Submission counts per sessionId for ParticipantManager
  const submissionCounts: Record<string, number> = {}
  for (const s of progressRaw) {
    submissionCounts[s.sessionId] = (submissionCounts[s.sessionId] ?? 0) + 1
  }

  const serializedLocations = locations.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }))

  const serializedSubmissions = submissionsRaw.map((s) => ({
    ...s,
    submittedAt: s.submittedAt.toISOString(),
    reviewedAt: s.reviewedAt?.toISOString() ?? null,
    nickname: nicknameMap[s.sessionId],
    location: {
      ...s.location,
      createdAt: s.location.createdAt.toISOString(),
    },
  }))

  // Progress by session with nickname
  const bySession: Record<string, { pending: number; approved: number; rejected: number; total: number }> = {}
  for (const s of progressRaw) {
    if (!bySession[s.sessionId]) bySession[s.sessionId] = { pending: 0, approved: 0, rejected: 0, total: 0 }
    bySession[s.sessionId].total++
    bySession[s.sessionId][s.status.toLowerCase() as 'pending' | 'approved' | 'rejected']++
  }
  const progressEntries = Object.entries(bySession).map(([sessionId, counts]) => ({
    sessionId,
    nickname: nicknameMap[sessionId],
    ...counts,
  }))

  const participantEntries = participants.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    token: p.token,
    createdAt: p.createdAt.toISOString(),
    lastSeenAt: p.lastSeenAt?.toISOString() ?? null,
    submissionCount: submissionCounts[p.id] ?? 0,
  }))

  return (
    <div className="space-y-8 py-6">
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-new-rocker)] text-xl text-[#aea99b] tracking-wide">
          Quest Master
        </h1>
        <p className="font-[family-name:var(--font-im-fell)] text-[#868174] text-sm italic mt-1">
          Manage the trials of Budapest
        </p>
      </div>

      <SvgDivider />

      <ParticipantManager initialParticipants={participantEntries} />

      <SvgDivider />

      <QrDisplay participants={participantEntries.map((p) => ({ id: p.id, nickname: p.nickname }))} />

      <SvgDivider />

      <LocationManager initialLocations={serializedLocations} />

      <SvgDivider />

      <SubmissionReview initialSubmissions={serializedSubmissions} />

      <SvgDivider />

      <ProgressTable entries={progressEntries} />
    </div>
  )
}
