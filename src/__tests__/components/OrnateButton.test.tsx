import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrnateButton } from '@/components/ui/OrnateButton'

describe('OrnateButton', () => {
  it('renders children text', () => {
    render(<OrnateButton>Click me</OrnateButton>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    render(<OrnateButton onClick={handleClick}>Click</OrnateButton>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('shows loading spinner when loading is true', () => {
    render(<OrnateButton loading>Submit</OrnateButton>)
    expect(screen.queryByText('Submit')).not.toBeInTheDocument()
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<OrnateButton disabled>Click</OrnateButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    render(<OrnateButton onClick={handleClick} disabled>Click</OrnateButton>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies primary variant class', () => {
    render(<OrnateButton variant="primary">Primary</OrnateButton>)
    expect(screen.getByRole('button')).toHaveClass('gothic-btn-primary')
  })

  it('applies default variant class', () => {
    render(<OrnateButton variant="default">Default</OrnateButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('gothic-btn')
    expect(button).not.toHaveClass('gothic-btn-primary')
  })

  it('accepts custom className', () => {
    render(<OrnateButton className="w-full">Text</OrnateButton>)
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('passes through type attribute', () => {
    render(<OrnateButton type="submit">Submit</OrnateButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
