import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT, DELETE } from '@/app/api/locations/[id]/route'

const mockSession = { isAdmin: false }

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}))

const { mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  default: {
    location: {
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}))

const params = Promise.resolve({ id: 'loc-1' })

function makePutRequest(body: object) {
  return new NextRequest('http://localhost/api/locations/loc-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest() {
  return new NextRequest('http://localhost/api/locations/loc-1', { method: 'DELETE' })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.isAdmin = false
  mockUpdate.mockResolvedValue({ id: 'loc-1', name: 'Updated' })
  mockDelete.mockResolvedValue({ id: 'loc-1' })
})

describe('PUT /api/locations/[id]', () => {
  it('returns 403 when not admin', async () => {
    mockSession.isAdmin = false
    const res = await PUT(makePutRequest({ name: 'New Name' }), { params })
    expect(res.status).toBe(403)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('updates location and returns 200 when admin', async () => {
    mockSession.isAdmin = true
    const body = { name: 'New Name', lat: 47.5, lng: 19.0 }
    const res = await PUT(makePutRequest(body), { params })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'loc-1' },
      data: expect.objectContaining({ name: 'New Name' }),
    })
  })

  it('returns 404 when location does not exist', async () => {
    mockSession.isAdmin = true
    mockUpdate.mockRejectedValue(new Error('Not found'))
    const res = await PUT(makePutRequest({ name: 'X' }), { params })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/locations/[id]', () => {
  it('returns 403 when not admin', async () => {
    mockSession.isAdmin = false
    const res = await DELETE(makeDeleteRequest(), { params })
    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes location and returns 200 when admin', async () => {
    mockSession.isAdmin = true
    const res = await DELETE(makeDeleteRequest(), { params })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'loc-1' } })
  })

  it('returns 404 when location does not exist', async () => {
    mockSession.isAdmin = true
    mockDelete.mockRejectedValue(new Error('Not found'))
    const res = await DELETE(makeDeleteRequest(), { params })
    expect(res.status).toBe(404)
  })
})
