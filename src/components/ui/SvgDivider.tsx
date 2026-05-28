export function SvgDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#d4cdbc60]" />
      <svg width="48" height="20" viewBox="0 0 48 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 2 C18 2 14 8 8 8 C4 8 1 6 1 6 C4 6 6 8 8 10 C10 12 12 14 14 14 C18 14 20 10 24 10 C28 10 30 14 34 14 C36 14 38 12 40 10 C42 8 44 6 47 6 C47 6 44 8 40 8 C34 8 30 2 24 2Z"
          fill="#d4cdbc"
          opacity="0.7"
        />
        <circle cx="24" cy="10" r="2" fill="#d4cdbc" />
        <circle cx="8" cy="10" r="1.5" fill="#d4cdbc" opacity="0.5" />
        <circle cx="40" cy="10" r="1.5" fill="#d4cdbc" opacity="0.5" />
      </svg>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#d4cdbc60]" />
    </div>
  )
}

export function SvgCornerOrnament({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 2 L12 2 L12 4 L4 4 L4 12 L2 12 Z" fill="#d4cdbc" opacity="0.6" />
      <path d="M2 2 Q8 2 8 8" stroke="#d4cdbc" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  )
}
