import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/admin/progress/route'

const mockSession = { isAdmin: false }

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}))

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }))

vi.mock('@/lib/db', () => ({
  default: {
    submission: { findMany: mockFindMany },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.isAdmin = false
})

describe('GET /api/admin/progress', () => {
  it('returns 403 when not admin', async () => {
    mockSession.isAdmin = false
    const res = await GET()
    expect(res.status).toBe(403)
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it('returns empty array when no submissions exist', async () => {
    mockSession.isAdmin = true
    mockFindMany.mockResolvedValue([])
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual([])
  })

  it('aggregates submissions by session correctly', async () => {
    mockSession.isAdmin = true
    mockFindMany.mockResolvedValue([
      { sessionId: 'session-a', status: 'APPROVED' },
      { sessionId: 'session-a', status: 'PENDING' },
      { sessionId: 'session-a', status: 'REJECTED' },
      { sessionId: 'session-b', status: 'APPROVED' },
      { sessionId: 'session-b', status: 'APPROVED' },
    ])

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(2)

    const sessionA = json.find((e: { sessionId: string }) => e.sessionId === 'session-a')
    expect(sessionA).toMatchObject({ total: 3, approved: 1, pending: 1, rejected: 1 })

    const sessionB = json.find((e: { sessionId: string }) => e.sessionId === 'session-b')
    expect(sessionB).toMatchObject({ total: 2, approved: 2, pending: 0, rejected: 0 })
  })

  it('counts a single session with only pending submissions', async () => {
    mockSession.isAdmin = true
    mockFindMany.mockResolvedValue([
      { sessionId: 'session-x', status: 'PENDING' },
      { sessionId: 'session-x', status: 'PENDING' },
    ])
    const res = await GET()
    const json = await res.json()
    expect(json[0]).toMatchObject({ sessionId: 'session-x', total: 2, pending: 2, approved: 0, rejected: 0 })
  })
})
