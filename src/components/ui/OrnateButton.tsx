'use client'

import { ButtonHTMLAttributes } from 'react'

interface OrnateButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger'
  loading?: boolean
}

export function OrnateButton({
  variant = 'default',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: OrnateButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'gothic-btn gothic-btn-primary'
      : variant === 'danger'
      ? 'gothic-btn border-red-800 text-red-400 hover:bg-red-900/20'
      : 'gothic-btn'

  return (
    <button
      className={`${variantClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
          <span>…</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
