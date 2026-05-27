import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/admin/route'

const mockSave = vi.fn()
const mockSession = {
  isAdmin: false,
  save: mockSave,
}

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}))

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/auth/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.isAdmin = false
  process.env.ADMIN_PASSWORD = 'test-admin-password'
})

describe('POST /api/auth/admin', () => {
  it('returns 200 and sets isAdmin when password is correct', async () => {
    const res = await POST(makeRequest({ password: 'test-admin-password' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(mockSession.isAdmin).toBe(true)
    expect(mockSave).toHaveBeenCalledOnce()
  })

  it('returns 401 when password is wrong', async () => {
    const res = await POST(makeRequest({ password: 'wrong' }))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Invalid password')
    expect(mockSession.isAdmin).toBe(false)
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('returns 401 when password is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(401)
    expect(mockSave).not.toHaveBeenCalled()
  })
})
