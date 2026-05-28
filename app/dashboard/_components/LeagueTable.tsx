"use client"

import type { Standing } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function LeagueTable({ standings = [], limit = 8 }: { standings?: Standing[]; limit?: number }) {
  const rows = (standings || []).slice(0, limit)

  return (
    <section aria-label="League table" className="overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
      <div className="flex items-center justify-between border-b border-[#1E1E1E] px-4 py-3">
        <h3 className="font-heading text-sm text-white">League Table</h3>
        <span className="text-xs text-[#7A7A7A]">{standings?.length ? `Top ${rows.length}` : ""}</span>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-[#7A7A7A]">No standings yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[#7A7A7A]">
                <th className="px-3 py-2 text-left font-bold">#</th>
                <th className="px-3 py-2 text-left font-bold">Player</th>
                <th className="px-3 py-2 text-right font-bold">P</th>
                <th className="hidden px-3 py-2 text-right font-bold sm:table-cell">GF</th>
                <th className="hidden px-3 py-2 text-right font-bold sm:table-cell">GA</th>
                <th className="hidden px-3 py-2 text-right font-bold sm:table-cell">GD</th>
                <th className="px-3 py-2 text-right font-bold">Pts</th>
                <th className="hidden px-3 py-2 text-left font-bold md:table-cell">Form</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, idx) => {
                const rank = idx + 1
                return (
                  <tr
                    key={s.playerId}
                    className={cn("border-t border-[#1A1A1A]", rank <= 3 && "bg-emerald-500/[0.03]")}
                  >
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "font-heading tabular-nums",
                          rank === 1
                            ? "text-amber-300"
                            : rank === 2
                              ? "text-slate-200"
                              : rank === 3
                                ? "text-orange-300"
                                : "text-[#9E9E9E]",
                        )}
                      >
                        {rank}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="max-w-[12rem] truncate font-medium text-white">{s.playerName}</div>
                      <div className="max-w-[12rem] truncate text-[11px] text-[#7A7A7A]">{s.team}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#D1D1D1]">{s.played}</td>
                    <td className="hidden px-3 py-2.5 text-right tabular-nums text-[#D1D1D1] sm:table-cell">
                      {s.goalsFor}
                    </td>
                    <td className="hidden px-3 py-2.5 text-right tabular-nums text-[#D1D1D1] sm:table-cell">
                      {s.goalsAgainst}
                    </td>
                    <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">
                      <span className={s.goalDifference >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {s.goalDifference > 0 ? "+" : ""}
                        {s.goalDifference}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="font-heading text-white tabular-nums">{s.points}</span>
                    </td>
                    <td className="hidden px-3 py-2.5 md:table-cell">
                      <div className="flex gap-1">
                        {(s.last5 || []).map((r, i) => (
                          <span
                            key={i}
                            title={r === "W" ? "Win" : r === "D" ? "Draw" : "Loss"}
                            className={cn(
                              "h-2 w-2 rounded-full",
                              r === "W" ? "bg-emerald-500" : r === "D" ? "bg-amber-500" : "bg-rose-500",
                            )}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
