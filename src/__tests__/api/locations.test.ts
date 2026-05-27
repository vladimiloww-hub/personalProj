import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/locations/route'

const mockSession = {
  isAdmin: false,
  questUnlocked: true,
  sessionId: 'test-session',
}

const mockLocations = [
  {
    id: 'loc-1',
    name: 'Fisherman\'s Bastion',
    description: 'Gothic terrace',
    taskDescription: 'Take a photo',
    lat: 47.5019,
    lng: 19.0345,
    referencePhotoUrl: 'https://example.com/photo.jpg',
    order: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'loc-2',
    name: 'Parliament',
    description: 'Grand building',
    taskDescription: 'Photograph the facade',
    lat: 47.5071,
    lng: 19.0453,
    referencePhotoUrl: 'https://example.com/photo2.jpg',
    order: 1,
    createdAt: new Date('2024-01-01'),
  },
]

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}))

const { mockFindMany, mockCreate } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  default: {
    location: {
      findMany: mockFindMany,
      create: mockCreate,
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.isAdmin = false
  mockFindMany.mockResolvedValue(mockLocations)
  mockCreate.mockResolvedValue({ id: 'new-loc', ...mockLocations[0] })
})

describe('GET /api/locations', () => {
  it('returns all locations ordered by order field', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(2)
    expect(json[0].name).toBe('Fisherman\'s Bastion')
    expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { order: 'asc' } })
  })

  it('returns empty array when no locations exist', async () => {
    mockFindMany.mockResolvedValue([])
    const res = await GET()
    const json = await res.json()
    expect(json).toEqual([])
  })
})

describe('POST /api/locations', () => {
  const validBody = {
    name: 'Chain Bridge',
    description: 'Iconic suspension bridge',
    taskDescription: 'Photo with lions',
    lat: 47.4982,
    lng: 19.0451,
    referencePhotoUrl: 'https://example.com/bridge.jpg',
    order: 2,
  }

  function makeRequest(body: object) {
    return new NextRequest('http://localhost/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('returns 403 when not admin', async () => {
    mockSession.isAdmin = false
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(403)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates location and returns 201 when admin', async () => {
    mockSession.isAdmin = true
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Chain Bridge', lat: 47.4982 }),
    })
  })

  it('returns 400 when required fields are missing', async () => {
    mockSession.isAdmin = true
    const res = await POST(makeRequest({ name: 'Incomplete' }))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('defaults order to 0 when not provided', async () => {
    mockSession.isAdmin = true
    const { order: _, ...bodyWithoutOrder } = validBody
    await POST(makeRequest(bodyWithoutOrder))
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ order: 0 }),
    })
  })
})
