"use client"

import { formatRecord } from "@/lib/formatters"

export default function PersonalStats({ stats }: { stats: any }) {
  return (
    <section aria-label="Personal stats" className="rounded-2xl p-4 border bg-[#0D0D0D] text-white">
      <h3 className="text-sm font-semibold">Personal Stats</h3>
      {stats ? (
        <div className="mt-2 grid grid-cols-4 gap-3">
          <div className="rounded-lg p-3 bg-[#141414] text-center">
            <div className="text-xs text-[#9E9E9E]">Goals</div>
            <div className="text-lg font-semibold tabular-nums text-[#00C853]">{stats.goals ?? 0}</div>
          </div>
          <div className="rounded-lg p-3 bg-[#141414] text-center">
            <div className="text-xs text-[#9E9E9E]">Assists</div>
            <div className="text-lg font-semibold tabular-nums text-[#00C853]">{stats.assists ?? 0}</div>
          </div>
          <div className="rounded-lg p-3 bg-[#141414] text-center">
            <div className="text-xs text-[#9E9E9E]">Yellow</div>
            <div className="text-lg font-semibold tabular-nums text-[#00C853]">{stats.yellow ?? 0}</div>
          </div>
          <div className="rounded-lg p-3 bg-[#141414] text-center">
            <div className="text-xs text-[#9E9E9E]">Red</div>
            <div className="text-lg font-semibold tabular-nums text-[#00C853]">{stats.red ?? 0}</div>
          </div>
          <div className="col-span-4 text-xs text-[#9E9E9E]">Record: {formatRecord(stats.wins, stats.draws, stats.losses)}</div>
        </div>
      ) : (
        <div className="mt-2 text-[#9E9E9E]">No stats yet.</div>
      )}
    </section>
  )
}
