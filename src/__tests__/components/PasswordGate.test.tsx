import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import PasswordGate from '@/app/PasswordGate'

const mockPush = vi.fn()
const mockGet = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useRouter).mockReturnValue({ push: mockPush, refresh: vi.fn(), replace: vi.fn() } as ReturnType<typeof useRouter>)
  vi.mocked(useSearchParams).mockReturnValue({ get: mockGet } as unknown as ReturnType<typeof useSearchParams>)
  mockGet.mockReturnValue(null) // no ?password= by default
  global.fetch = vi.fn()
})

describe('PasswordGate', () => {
  describe('manual password entry', () => {
    it('renders password input and submit button', () => {
      render(<PasswordGate />)
      expect(screen.getByPlaceholderText('Enter access code')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /enter the quest/i })).toBeInTheDocument()
    })

    it('submit button is disabled when password is empty', () => {
      render(<PasswordGate />)
      expect(screen.getByRole('button', { name: /enter the quest/i })).toBeDisabled()
    })

    it('submit button becomes enabled when password is typed', async () => {
      render(<PasswordGate />)
      await userEvent.type(screen.getByPlaceholderText('Enter access code'), 'secret')
      expect(screen.getByRole('button', { name: /enter the quest/i })).not.toBeDisabled()
    })

    it('POSTs to /api/auth/quest and redirects on success', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
      render(<PasswordGate />)
      await userEvent.type(screen.getByPlaceholderText('Enter access code'), 'correct-password')
      await userEvent.click(screen.getByRole('button', { name: /enter the quest/i }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/quest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'correct-password' }),
        })
        expect(mockPush).toHaveBeenCalledWith('/quest')
      })
    })

    it('shows error message on invalid password', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{"error":"Invalid"}', { status: 401 }))
      render(<PasswordGate />)
      await userEvent.type(screen.getByPlaceholderText('Enter access code'), 'wrong')
      await userEvent.click(screen.getByRole('button', { name: /enter the quest/i }))

      await waitFor(() => {
        expect(screen.getByText(/the seal does not match/i)).toBeInTheDocument()
      })
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('shows error on network failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
      render(<PasswordGate />)
      await userEvent.type(screen.getByPlaceholderText('Enter access code'), 'password')
      await userEvent.click(screen.getByRole('button', { name: /enter the quest/i }))

      await waitFor(() => {
        expect(screen.getByText(/dark force disrupted/i)).toBeInTheDocument()
      })
    })

    it('submits on Enter key press', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
      render(<PasswordGate />)
      const input = screen.getByPlaceholderText('Enter access code')
      await userEvent.type(input, 'my-password{Enter}')

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledOnce()
      })
    })
  })

  describe('QR code auto-submit flow', () => {
    it('auto-submits when ?password= is present in URL', async () => {
      mockGet.mockReturnValue('qr-password')
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))

      render(<PasswordGate />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/quest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'qr-password' }),
        })
        expect(mockPush).toHaveBeenCalledWith('/quest')
      })
    })

    it('shows verifying spinner during auto-submit', async () => {
      mockGet.mockReturnValue('qr-password')
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(() => {}) // never resolves
      )
      render(<PasswordGate />)
      await waitFor(() => {
        expect(screen.getByText(/verifying the seal/i)).toBeInTheDocument()
      })
    })

    it('does not auto-submit when ?password= is absent', () => {
      mockGet.mockReturnValue(null)
      render(<PasswordGate />)
      expect(fetch).not.toHaveBeenCalled()
    })
  })
})
