import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/submissions/[id]/route'

const mockSession = { isAdmin: false }

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}))

const { mockUpdate } = vi.hoisted(() => ({ mockUpdate: vi.fn() }))

vi.mock('@/lib/db', () => ({
  default: {
    submission: { update: mockUpdate },
  },
}))

const params = Promise.resolve({ id: 'sub-1' })

function makePatchRequest(body: object) {
  return new NextRequest('http://localhost/api/submissions/sub-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const mockUpdatedSubmission = {
  id: 'sub-1',
  locationId: 'loc-1',
  status: 'APPROVED',
  reviewedAt: new Date(),
  location: { id: 'loc-1', name: 'Fisherman\'s Bastion' },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.isAdmin = false
  mockUpdate.mockResolvedValue(mockUpdatedSubmission)
})

describe('PATCH /api/submissions/[id]', () => {
  it('returns 403 when not admin', async () => {
    mockSession.isAdmin = false
    const res = await PATCH(makePatchRequest({ status: 'APPROVED' }), { params })
    expect(res.status).toBe(403)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('approves submission when admin sends APPROVED', async () => {
    mockSession.isAdmin = true
    const res = await PATCH(makePatchRequest({ status: 'APPROVED' }), { params })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: expect.objectContaining({ status: 'APPROVED', reviewedAt: expect.any(Date) }),
      include: { location: true },
    })
    const json = await res.json()
    expect(json.status).toBe('APPROVED')
  })

  it('rejects submission when admin sends REJECTED', async () => {
    mockSession.isAdmin = true
    mockUpdate.mockResolvedValue({ ...mockUpdatedSubmission, status: 'REJECTED' })
    const res = await PATCH(makePatchRequest({ status: 'REJECTED' }), { params })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('REJECTED')
  })

  it('returns 400 for invalid status value', async () => {
    mockSession.isAdmin = true
    const res = await PATCH(makePatchRequest({ status: 'PENDING' }), { params })
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 400 for completely wrong status', async () => {
    mockSession.isAdmin = true
    const res = await PATCH(makePatchRequest({ status: 'INVALID' }), { params })
    expect(res.status).toBe(400)
  })

  it('returns 404 when submission does not exist', async () => {
    mockSession.isAdmin = true
    mockUpdate.mockRejectedValue(new Error('Record not found'))
    const res = await PATCH(makePatchRequest({ status: 'APPROVED' }), { params })
    expect(res.status).toBe(404)
  })
})
