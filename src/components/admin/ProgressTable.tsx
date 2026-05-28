interface ProgressEntry {
  sessionId: string
  nickname?: string
  total: number
  pending: number
  approved: number
  rejected: number
}

export function ProgressTable({ entries }: { entries: ProgressEntry[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-[family-name:var(--font-new-rocker)] text-sm tracking-widest text-[#d4cdbc] uppercase">
        Player Progress
      </h2>

      {entries.length === 0 ? (
        <p className="font-[family-name:var(--font-im-fell)] text-[#868174] text-sm italic text-center py-4">
          No players yet.
        </p>
      ) : (
        <div className="gothic-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#433f37]">
                {['Seeker', 'Total', 'Approved', 'Pending', 'Rejected'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-[family-name:var(--font-cinzel)] text-[9px] tracking-widest text-[#868174] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.sessionId} className="border-b border-[#433f37] last:border-0">
                  <td className="px-3 py-2 font-[family-name:var(--font-cinzel)] text-[#aea99b] text-[10px]">
                    {e.nickname ?? `${e.sessionId.slice(0, 8)}…`}
                  </td>
                  <td className="px-3 py-2 text-[#aea99b]">{e.total}</td>
                  <td className="px-3 py-2 text-green-400">{e.approved}</td>
                  <td className="px-3 py-2 text-amber-400">{e.pending}</td>
                  <td className="px-3 py-2 text-red-400">{e.rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
