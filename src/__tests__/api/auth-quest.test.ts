import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/quest/route'

const mockSave = vi.fn()
const mockSession = {
  sessionId: undefined as string | undefined,
  questUnlocked: false,
  isAdmin: false,
  save: mockSave,
}

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}))

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/auth/quest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.sessionId = undefined
  mockSession.questUnlocked = false
  process.env.QUEST_PASSWORD = 'test-quest-password'
})

describe('POST /api/auth/quest', () => {
  it('returns 200 and sets questUnlocked when password is correct', async () => {
    const res = await POST(makeRequest({ password: 'test-quest-password' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(mockSession.questUnlocked).toBe(true)
    expect(mockSession.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
    expect(mockSave).toHaveBeenCalledOnce()
  })

  it('preserves existing sessionId when already set', async () => {
    mockSession.sessionId = 'existing-session-id'
    await POST(makeRequest({ password: 'test-quest-password' }))
    expect(mockSession.sessionId).toBe('existing-session-id')
  })

  it('returns 401 when password is wrong', async () => {
    const res = await POST(makeRequest({ password: 'wrong-password' }))
    expect(res.status).toBe(401)
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('returns 401 when password is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(401)
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('returns 401 when password is empty string', async () => {
    const res = await POST(makeRequest({ password: '' }))
    expect(res.status).toBe(401)
  })
})
