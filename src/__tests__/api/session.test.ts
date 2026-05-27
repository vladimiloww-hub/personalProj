import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/session/route'

const mockSession = {
  sessionId: 'abc-123',
  questUnlocked: true,
  isAdmin: false,
}

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.sessionId = 'abc-123'
  mockSession.questUnlocked = true
  mockSession.isAdmin = false
})

describe('GET /api/session', () => {
  it('returns session data', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.sessionId).toBe('abc-123')
    expect(json.questUnlocked).toBe(true)
    expect(json.isAdmin).toBe(false)
  })

  it('returns null sessionId and false flags when session is empty', async () => {
    mockSession.sessionId = undefined as unknown as string
    mockSession.questUnlocked = false
    mockSession.isAdmin = false

    const res = await GET()
    const json = await res.json()
    expect(json.sessionId).toBeNull()
    expect(json.questUnlocked).toBe(false)
    expect(json.isAdmin).toBe(false)
  })

  it('returns isAdmin true when session has admin flag', async () => {
    mockSession.isAdmin = true
    const res = await GET()
    const json = await res.json()
    expect(json.isAdmin).toBe(true)
  })
})
