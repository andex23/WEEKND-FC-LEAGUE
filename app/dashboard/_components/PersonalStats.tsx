"use client"

import { formatRecord } from "@/lib/formatters"
import { cn } from "@/lib/utils"

const CELLS = [
  { key: "goals", label: "Goals", color: "text-emerald-400" },
  { key: "assists", label: "Assists", color: "text-sky-400" },
  { key: "yellow", label: "Yellow", color: "text-yellow-300" },
  { key: "red", label: "Red", color: "text-rose-400" },
] as const

export default function PersonalStats({ stats }: { stats: any }) {
  const s = stats || {}
  return (
    <section aria-label="Personal stats" className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
      <h3 className="font-heading text-sm text-white">Personal Stats</h3>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {CELLS.map((c) => (
          <div key={c.key} className="rounded-lg border border-[#1E1E1E] bg-[#0D0D0D] py-3 text-center">
            <div className={cn("font-heading text-xl tabular-nums", c.color)}>{s[c.key] ?? 0}</div>
            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#7A7A7A]">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-[#0D0D0D] px-3 py-2 text-xs">
        <span className="font-bold uppercase tracking-wider text-[#7A7A7A]">Record</span>
        <span className="font-heading text-white">{formatRecord(s.wins, s.draws, s.losses)}</span>
      </div>
    </section>
  )
}
