"use client"

import type { Standing } from "@/lib/types"

export default function LeagueTable({ standings = [], limit = 8 }: { standings?: Standing[]; limit?: number }) {
  const rows = (standings || []).slice(0, limit)

  return (
    <section aria-label="League table" className="rounded-2xl bg-[#141414] border p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">League Table</h2>
        <div className="text-xs text-[#9E9E9E]">{standings?.length ? `${standings.length} players` : ""}</div>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-[#9E9E9E]">No standings yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[#9E9E9E]">
              <tr className="text-left">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-4">Player</th>
                <th className="py-2 pr-4 hidden sm:table-cell">Team</th>
                <th className="py-2 pr-2 text-right">P</th>
                <th className="py-2 pr-2 text-right hidden md:table-cell">W</th>
                <th className="py-2 pr-2 text-right hidden md:table-cell">D</th>
                <th className="py-2 pr-2 text-right hidden md:table-cell">L</th>
                <th className="py-2 pr-2 text-right hidden lg:table-cell">GF</th>
                <th className="py-2 pr-2 text-right hidden lg:table-cell">GA</th>
                <th className="py-2 pr-2 text-right hidden sm:table-cell">GD</th>
                <th className="py-2 pl-2 text-right">Pts</th>
                <th className="py-2 pl-4 hidden xl:table-cell">Form</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, idx) => (
                <tr key={s.playerId} className="border-t border-[#1E1E1E]">
                  <td className="py-2 pr-2 align-middle text-[#9E9E9E] tabular-nums">{idx + 1}</td>
                  <td className="py-2 pr-4 align-middle">
                    <div className="font-medium truncate max-w-[12rem]">{s.playerName}</div>
                  </td>
                  <td className="py-2 pr-4 align-middle hidden sm:table-cell">
                    <div className="truncate max-w-[10rem] text-[#9E9E9E]">{s.team}</div>
                  </td>
                  <td className="py-2 pr-2 align-middle text-right tabular-nums">{s.played}</td>
                  <td className="py-2 pr-2 align-middle text-right hidden md:table-cell tabular-nums">{s.won}</td>
                  <td className="py-2 pr-2 align-middle text-right hidden md:table-cell tabular-nums">{s.drawn}</td>
                  <td className="py-2 pr-2 align-middle text-right hidden md:table-cell tabular-nums">{s.lost}</td>
                  <td className="py-2 pr-2 align-middle text-right hidden lg:table-cell tabular-nums">{s.goalsFor}</td>
                  <td className="py-2 pr-2 align-middle text-right hidden lg:table-cell tabular-nums">{s.goalsAgainst}</td>
                  <td className="py-2 pr-2 align-middle text-right hidden sm:table-cell tabular-nums">{s.goalDifference}</td>
                  <td className="py-2 pl-2 align-middle text-right font-semibold text-[#00C853] tabular-nums">{s.points}</td>
                  <td className="py-2 pl-4 align-middle hidden xl:table-cell">
                    <div className="flex gap-1">
                      {(s.last5 || []).map((r, i) => (
                        <span
                          key={i}
                          className={
                            "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded text-[10px] font-semibold " +
                            (r === "W"
                              ? "bg-emerald-600/20 text-emerald-400"
                              : r === "D"
                              ? "bg-zinc-600/20 text-zinc-300"
                              : "bg-rose-600/20 text-rose-400")
                          }
                          aria-label={r === "W" ? "Win" : r === "D" ? "Draw" : "Loss"}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
