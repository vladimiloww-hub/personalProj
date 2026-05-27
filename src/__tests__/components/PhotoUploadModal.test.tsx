import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoUploadModal } from '@/components/quest/PhotoUploadModal'
import type { Submission } from '@/types/quest'

const mockLocation = {
  id: 'loc-1',
  name: 'Fisherman\'s Bastion',
  lat: 47.5019,
  lng: 19.0345,
}

const mockSubmission: Submission = {
  id: 'sub-1',
  locationId: 'loc-1',
  sessionId: 'player-session',
  photoUrl: 'https://blob.example.com/photo.jpg',
  status: 'PENDING',
  submittedAt: '2024-01-01T10:00:00.000Z',
  reviewedAt: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn()
  global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/preview-url')
})

describe('PhotoUploadModal', () => {
  it('renders location name', () => {
    render(<PhotoUploadModal location={mockLocation} onClose={vi.fn()} onSubmitted={vi.fn()} />)
    expect(screen.getByText('Fisherman\'s Bastion')).toBeInTheDocument()
  })

  it('renders Submit Proof heading', () => {
    render(<PhotoUploadModal location={mockLocation} onClose={vi.fn()} onSubmitted={vi.fn()} />)
    expect(screen.getByText(/submit proof/i)).toBeInTheDocument()
  })

  it('renders Tap to take photo placeholder', () => {
    render(<PhotoUploadModal location={mockLocation} onClose={vi.fn()} onSubmitted={vi.fn()} />)
    expect(screen.getByText(/tap to take photo/i)).toBeInTheDocument()
  })

  it('shows Cancel and Submit buttons', () => {
    render(<PhotoUploadModal location={mockLocation} onClose={vi.fn()} onSubmitted={vi.fn()} />)
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('Submit button is disabled before file is selected', () => {
    render(<PhotoUploadModal location={mockLocation} onClose={vi.fn()} onSubmitted={vi.fn()} />)
    expect(screen.getByRole('button', { name: /^submit$/i })).toBeDisabled()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<PhotoUploadModal location={mockLocation} onClose={onClose} onSubmitted={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes when backdrop is clicked', async () => {
    const onClose = vi.fn()
    const { container } = render(
      <PhotoUploadModal location={mockLocation} onClose={onClose} onSubmitted={vi.fn()} />
    )
    // Click the backdrop (the outer fixed div)
    const backdrop = container.firstChild as HTMLElement
    await userEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('enables Submit button after file is selected', async () => {
    render(<PhotoUploadModal location={mockLocation} onClose={vi.fn()} onSubmitted={vi.fn()} />)
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    expect(screen.getByRole('button', { name: /^submit$/i })).not.toBeDisabled()
  })

  it('POSTs to /api/submissions and calls onSubmitted on success', async () => {
    const onSubmitted = vi.fn()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockSubmission), { status: 201 })
    )
    render(<PhotoUploadModal location={mockLocation} onClose={vi.fn()} onSubmitted={onSubmitted} />)

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    await userEvent.click(screen.getByRole('button', { name: /^submit$/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/submissions', {
        method: 'POST',
        body: expect.any(FormData),
      })
      expect(onSubmitted).toHaveBeenCalledWith(mockSubmission)
    })
  })

  it('shows error message on upload failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Already pending review' }), { status: 409 })
    )
    render(<PhotoUploadModal location={mockLocation} onClose={vi.fn()} onSubmitted={vi.fn()} />)

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    await userEvent.click(screen.getByRole('button', { name: /^submit$/i }))

    await waitFor(() => {
      expect(screen.getByText('Already pending review')).toBeInTheDocument()
    })
  })

  it('shows error on network failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    render(<PhotoUploadModal location={mockLocation} onClose={vi.fn()} onSubmitted={vi.fn()} />)

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    await userEvent.click(screen.getByRole('button', { name: /^submit$/i }))

    await waitFor(() => {
      expect(screen.getByText(/connection failed/i)).toBeInTheDocument()
    })
  })
})
