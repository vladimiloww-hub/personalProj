export default function QuestLoading() {
  return (
    <main className="min-h-dvh flex items-center justify-center">
      <div className="text-center space-y-4">
        <svg
          className="mx-auto w-12 h-12 text-[#c4a35a] animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            className="opacity-80"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
          />
        </svg>
        <p className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.3em] text-[#8a7a64] uppercase animate-pulse">
          Summoning the quest…
        </p>
      </div>
    </main>
  )
}
