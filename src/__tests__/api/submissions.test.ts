import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/submissions/route'

const mockSession = {
  isAdmin: false,
  questUnlocked: true,
  sessionId: 'player-session-id',
}

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}))

const { mockFindUnique, mockUpsert, mockFindMany } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpsert: vi.fn(),
  mockFindMany: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  default: {
    submission: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
      findMany: mockFindMany,
    },
  },
}))

const { mockUploadPhoto } = vi.hoisted(() => ({ mockUploadPhoto: vi.fn() }))

vi.mock('@/lib/blob', () => ({
  uploadPhoto: mockUploadPhoto,
}))

// Avoid jsdom File vs undici File incompatibility by mocking req.formData() directly
function makePostRequest(locationId: string | null, file?: { name: string; type: string } | null) {
  const fakeFile = file ? Object.assign(new Blob(['x'], { type: file.type }), { name: file.name }) : null
  const req = {
    formData: vi.fn().mockResolvedValue({
      get: (key: string) => {
        if (key === 'locationId') return locationId
        if (key === 'file') return fakeFile
        return null
      },
    }),
  } as unknown as NextRequest
  return req
}

const mockSubmission = {
  id: 'sub-1',
  locationId: 'loc-1',
  sessionId: 'player-session-id',
  photoUrl: 'https://blob.vercel-storage.com/photo.jpg',
  status: 'PENDING',
  submittedAt: new Date(),
  reviewedAt: null,
}

const mockSubmissions = [
  { ...mockSubmission, location: { id: 'loc-1', name: 'Fisherman\'s Bastion' } },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.isAdmin = false
  mockSession.questUnlocked = true
  mockSession.sessionId = 'player-session-id'
  mockFindUnique.mockResolvedValue(null)
  mockUpsert.mockResolvedValue(mockSubmission)
  mockFindMany.mockResolvedValue(mockSubmissions)
  mockUploadPhoto.mockResolvedValue('https://blob.vercel-storage.com/photo.jpg')
})

describe('GET /api/submissions', () => {
  it('returns 403 when not admin', async () => {
    mockSession.isAdmin = false
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns all submissions with locations when admin', async () => {
    mockSession.isAdmin = true
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0].location.name).toBe('Fisherman\'s Bastion')
    expect(mockFindMany).toHaveBeenCalledWith({
      include: { location: true },
      orderBy: { submittedAt: 'desc' },
    })
  })
})

describe('POST /api/submissions', () => {
  const testFile = { name: 'photo.jpg', type: 'image/jpeg' }

  it('returns 401 when quest is not unlocked', async () => {
    mockSession.questUnlocked = false
    const res = await POST(makePostRequest('loc-1', testFile))
    expect(res.status).toBe(401)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('returns 401 when sessionId is missing', async () => {
    mockSession.sessionId = undefined as unknown as string
    const res = await POST(makePostRequest('loc-1', testFile))
    expect(res.status).toBe(401)
  })

  it('returns 400 when file is missing', async () => {
    const res = await POST(makePostRequest('loc-1', null))
    expect(res.status).toBe(400)
  })

  it('returns 400 when locationId is missing', async () => {
    const res = await POST(makePostRequest(null, testFile))
    expect(res.status).toBe(400)
  })

  it('creates submission and returns 201 for new submission', async () => {
    const res = await POST(makePostRequest('loc-1', testFile))
    expect(res.status).toBe(201)
    expect(mockUploadPhoto).toHaveBeenCalledWith(expect.any(Blob), 'submissions')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { locationId_sessionId: { locationId: 'loc-1', sessionId: 'player-session-id' } },
        create: expect.objectContaining({ status: 'PENDING' }),
      })
    )
  })

  it('returns 409 when submission is already APPROVED', async () => {
    mockFindUnique.mockResolvedValue({ ...mockSubmission, status: 'APPROVED' })
    const res = await POST(makePostRequest('loc-1', testFile))
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe('Already completed')
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('returns 409 when submission is already PENDING', async () => {
    mockFindUnique.mockResolvedValue({ ...mockSubmission, status: 'PENDING' })
    const res = await POST(makePostRequest('loc-1', testFile))
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe('Already pending review')
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('allows resubmission when previous submission was REJECTED', async () => {
    mockFindUnique.mockResolvedValue({ ...mockSubmission, status: 'REJECTED' })
    const res = await POST(makePostRequest('loc-1', testFile))
    expect(res.status).toBe(201)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: 'PENDING', reviewedAt: null }),
      })
    )
  })
})
