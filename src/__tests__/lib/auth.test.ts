import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from 'next/navigation'
import { requireQuestSession, requireAdminSession } from '@/lib/auth'

const mockSession = {
  sessionId: 'test-session',
  questUnlocked: false,
  isAdmin: false,
}

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.questUnlocked = false
  mockSession.isAdmin = false
})

describe('requireQuestSession', () => {
  it('redirects to / when quest is not unlocked', async () => {
    mockSession.questUnlocked = false
    await requireQuestSession().catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('returns session when quest is unlocked', async () => {
    mockSession.questUnlocked = true
    const session = await requireQuestSession()
    expect(session.questUnlocked).toBe(true)
    expect(redirect).not.toHaveBeenCalled()
  })
})

describe('requireAdminSession', () => {
  it('redirects to /admin/login when not admin', async () => {
    mockSession.isAdmin = false
    await requireAdminSession().catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/admin/login')
  })

  it('returns session when user is admin', async () => {
    mockSession.isAdmin = true
    const session = await requireAdminSession()
    expect(session.isAdmin).toBe(true)
    expect(redirect).not.toHaveBeenCalled()
  })
})
