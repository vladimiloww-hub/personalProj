interface ProgressEntry {
  sessionId: string
  total: number
  pending: number
  approved: number
  rejected: number
}

export function ProgressTable({ entries }: { entries: ProgressEntry[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-[family-name:var(--font-cinzel)] text-sm tracking-widest text-[#c4a35a] uppercase">
        Player Progress
      </h2>

      {entries.length === 0 ? (
        <p className="font-[family-name:var(--font-im-fell)] text-[#8a7a64] text-sm italic text-center py-4">
          No players yet.
        </p>
      ) : (
        <div className="gothic-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#3d2e1a]">
                {['Session', 'Total', 'Approved', 'Pending', 'Rejected'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-[family-name:var(--font-cinzel)] text-[9px] tracking-widest text-[#8a7a64] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.sessionId} className="border-b border-[#3d2e1a] last:border-0">
                  <td className="px-3 py-2 font-[family-name:var(--font-cinzel)] text-[#8a7a64] text-[10px]">
                    {e.sessionId.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2 text-[#e8dcc8]">{e.total}</td>
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
