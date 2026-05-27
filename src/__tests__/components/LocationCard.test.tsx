import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocationCard } from '@/components/quest/LocationCard'
import type { Submission } from '@/types/quest'

const mockLocation = {
  id: 'loc-1',
  name: 'Fisherman\'s Bastion',
  description: 'A neo-Gothic terrace overlooking the Danube.',
  taskDescription: 'Photograph the panoramic view.',
  lat: 47.5019,
  lng: 19.0345,
  referencePhotoUrl: 'https://example.com/photo.jpg',
  order: 0,
}

const mockApprovedSubmission: Submission = {
  id: 'sub-1',
  locationId: 'loc-1',
  sessionId: 'player-session',
  photoUrl: 'https://blob.example.com/photo.jpg',
  status: 'APPROVED',
  submittedAt: '2024-01-01T10:00:00.000Z',
  reviewedAt: '2024-01-01T11:00:00.000Z',
}

const mockPendingSubmission: Submission = {
  ...mockApprovedSubmission,
  status: 'PENDING',
  reviewedAt: null,
}

// PhotoUploadModal opens when "Submit Proof" is clicked — mock it to avoid complexity
vi.mock('@/components/quest/PhotoUploadModal', () => ({
  PhotoUploadModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="upload-modal">
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LocationCard', () => {
  describe('locked state (no submission)', () => {
    it('renders location name', () => {
      render(<LocationCard location={mockLocation} submission={null} onSubmitted={vi.fn()} />)
      expect(screen.getByText('Fisherman\'s Bastion')).toBeInTheDocument()
    })

    it('renders location description', () => {
      render(<LocationCard location={mockLocation} submission={null} onSubmitted={vi.fn()} />)
      expect(screen.getByText('A neo-Gothic terrace overlooking the Danube.')).toBeInTheDocument()
    })

    it('renders task description', () => {
      render(<LocationCard location={mockLocation} submission={null} onSubmitted={vi.fn()} />)
      expect(screen.getByText('Photograph the panoramic view.')).toBeInTheDocument()
    })

    it('renders Submit Proof button', () => {
      render(<LocationCard location={mockLocation} submission={null} onSubmitted={vi.fn()} />)
      expect(screen.getByRole('button', { name: /submit proof/i })).toBeInTheDocument()
    })

    it('shows Google Maps link with correct coordinates', () => {
      render(<LocationCard location={mockLocation} submission={null} onSubmitted={vi.fn()} />)
      const coordLink = screen.getByRole('link')
      expect(coordLink).toHaveAttribute('href', 'https://www.google.com/maps?q=47.5019,19.0345')
      expect(coordLink).toHaveAttribute('target', '_blank')
    })

    it('opens upload modal when Submit Proof is clicked', async () => {
      render(<LocationCard location={mockLocation} submission={null} onSubmitted={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /submit proof/i }))
      expect(screen.getByTestId('upload-modal')).toBeInTheDocument()
    })

    it('closes upload modal when close is triggered', async () => {
      render(<LocationCard location={mockLocation} submission={null} onSubmitted={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /submit proof/i }))
      expect(screen.getByTestId('upload-modal')).toBeInTheDocument()
      await userEvent.click(screen.getByText('Close Modal'))
      expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument()
    })

    it('renders order badge', () => {
      render(<LocationCard location={mockLocation} submission={null} onSubmitted={vi.fn()} />)
      expect(screen.getByText('01')).toBeInTheDocument()
    })
  })

  describe('pending state', () => {
    it('shows awaiting review text instead of submit button', () => {
      render(<LocationCard location={mockLocation} submission={mockPendingSubmission} onSubmitted={vi.fn()} />)
      expect(screen.getByText(/awaiting review/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /submit proof/i })).not.toBeInTheDocument()
    })

    it('does not show Submit Proof button', () => {
      render(<LocationCard location={mockLocation} submission={mockPendingSubmission} onSubmitted={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /submit proof/i })).not.toBeInTheDocument()
    })
  })

  describe('approved state', () => {
    it('shows completed text', () => {
      render(<LocationCard location={mockLocation} submission={mockApprovedSubmission} onSubmitted={vi.fn()} />)
      expect(screen.getByText(/completed/i)).toBeInTheDocument()
    })

    it('does not show Submit Proof button', () => {
      render(<LocationCard location={mockLocation} submission={mockApprovedSubmission} onSubmitted={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /submit proof/i })).not.toBeInTheDocument()
    })

    it('still shows coordinates link', () => {
      render(<LocationCard location={mockLocation} submission={mockApprovedSubmission} onSubmitted={vi.fn()} />)
      expect(screen.getByRole('link')).toHaveAttribute(
        'href', 'https://www.google.com/maps?q=47.5019,19.0345'
      )
    })
  })

  describe('onSubmitted callback', () => {
    it('calls onSubmitted with new submission and closes modal', async () => {
      // Re-mock PhotoUploadModal to simulate a successful submission
      const onSubmitted = vi.fn()
      const testSub = { ...mockPendingSubmission, id: 'new-sub' }

      vi.doMock('@/components/quest/PhotoUploadModal', () => ({
        PhotoUploadModal: ({ onSubmitted: submitCb }: { onSubmitted: (s: Submission) => void }) => (
          <button onClick={() => submitCb(testSub)}>Simulate Submit</button>
        ),
      }))

      render(<LocationCard location={mockLocation} submission={null} onSubmitted={onSubmitted} />)
      await userEvent.click(screen.getByRole('button', { name: /submit proof/i }))
    })
  })
})
