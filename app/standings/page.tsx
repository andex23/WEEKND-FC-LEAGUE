"use client"

import { useState, useEffect, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StandingRow {
  id: string
  name: string
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}

interface PlayerStats {
  topScorers: Array<{ rank: number; name: string; team: string; goals: number }>
  topAssists: Array<{ rank: number; name: string; team: string; assists: number }>
  discipline: Array<{ name: string; team: string; yellow_cards: number; red_cards: number }>
}

export default function StandingsPage() {
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ topScorers: [], topAssists: [], discipline: [] })
  const [fixtures, setFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [consoleFilter, setConsoleFilter] = useState("all")
  const [tab, setTab] = useState<"UPCOMING" | "COMPLETED">("UPCOMING")

  useEffect(() => {
    fetchData()
  }, [consoleFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const standingsUrl = consoleFilter === "all" ? "/api/standings" : `/api/standings?console=${consoleFilter}`
      const [standingsResponse, statsResponse, fixturesResponse] = await Promise.all([
        fetch(standingsUrl),
        fetch("/api/player-stats"),
        fetch("/api/fixtures"),
      ])

      if (standingsResponse.ok) {
        const data = await standingsResponse.json()
        const rows = (data.standings || []).map((s: any) => ({
          id: s.playerId || s.id || String(Math.random()),
          name: s.playerName || s.name,
          team: s.team,
          played: s.played || 0,
          won: s.won || 0,
          drawn: s.drawn || 0,
          lost: s.lost || 0,
          goals_for: s.goalsFor || s.goals_for || 0,
          goals_against: s.goalsAgainst || s.goals_against || 0,
          goal_difference: s.goalDifference || s.goal_difference || 0,
          points: s.points || 0,
        }))
        setStandings(rows)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setPlayerStats(statsData)
      }

      if (fixturesResponse.ok) {
        const f = await fixturesResponse.json()
        setFixtures(f.fixtures || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const upcoming = useMemo(() => fixtures.filter((f: any) => String(f.status || "").toUpperCase() !== "PLAYED").slice(0, 8), [fixtures])
  const completed = useMemo(() => fixtures.filter((f: any) => String(f.status || "").toUpperCase() === "PLAYED").slice(0, 8), [fixtures])
  const shown = tab === "UPCOMING" ? upcoming : completed

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <div className="text-[#9E9E9E]">Loading standings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold">Standings</h1>
            <p className="text-sm text-[#9E9E9E]">Weekend FC League</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={consoleFilter} onValueChange={setConsoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by console" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Consoles</SelectItem>
                <SelectItem value="PS5">PlayStation 5</SelectItem>
                <SelectItem value="XBOX">Xbox Series X/S</SelectItem>
                <SelectItem value="PC">PC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* League table */}
        <section className="rounded-2xl border bg-[#141414] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1E1E1E] flex items-center justify-between">
            <h2 className="text-sm font-semibold">League Table</h2>
            <div className="text-xs text-[#9E9E9E]">{standings.length} players</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[#9E9E9E] sticky top-0 z-10 bg-[#141414]">
                <tr>
                  <th className="text-left px-3 py-2">Pos</th>
                  <th className="text-left px-3 py-2">Player</th>
                  <th className="text-left px-3 py-2">Team</th>
                  <th className="text-right px-3 py-2">P</th>
                  <th className="text-right px-3 py-2">W</th>
                  <th className="text-right px-3 py-2">D</th>
                  <th className="text-right px-3 py-2">L</th>
                  <th className="text-right px-3 py-2">GF</th>
                  <th className="text-right px-3 py-2">GA</th>
                  <th className="text-right px-3 py-2">GD</th>
                  <th className="text-right px-3 py-2">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, idx) => (
                  <tr key={s.id} className="border-t border-[#1E1E1E]">
                    <td className="px-3 py-2 tabular-nums text-[#D1D1D1]">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium">{s.name}</td>
                    <td className="px-3 py-2 text-[#9E9E9E]">{s.team}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.played}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.won}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.drawn}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.lost}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.goals_for}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.goals_against}</td>
                    <td className="px-3 py-2 text-right tabular-nums"><span className={s.goal_difference >= 0 ? "text-emerald-400" : "text-rose-400"}>{s.goal_difference > 0 ? "+" : ""}{s.goal_difference}</span></td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{s.points}</td>
                  </tr>
                ))}
                {standings.length === 0 && (
                  <tr><td className="px-3 py-4 text-sm text-[#9E9E9E]" colSpan={11}>No standings yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Fixtures list */}
        <section className="rounded-2xl border bg-[#141414] p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Fixtures</h2>
            <div className="text-xs text-[#9E9E9E]">{shown.length} shown</div>
          </div>
          <div className="mb-2">
            <button className={`px-2 py-0.5 rounded ${tab === "UPCOMING" ? "bg-emerald-500 text-white" : ""}`} onClick={() => setTab("UPCOMING")}>Upcoming</button>
            <button className={`px-2 py-0.5 rounded ml-1 ${tab === "COMPLETED" ? "bg-emerald-500 text-white" : ""}`} onClick={() => setTab("COMPLETED")}>Completed</button>
          </div>
          {shown.length === 0 ? (
            <div className="text-sm text-[#9E9E9E]">No fixtures.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {shown.map((f: any) => (
                <li key={f.id} className="border-t first:border-t-0 border-[#1E1E1E] pt-2">
                  <div className="flex items-center justify-between">
                    <div className="truncate mr-2">MD{f.matchday} • {f.homePlayer} vs {f.awayPlayer}</div>
                    <div className="text-xs text-[#9E9E9E]">{f.scheduledDate ? new Date(f.scheduledDate).toLocaleString() : "TBD"}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Stats widgets */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border bg-[#141414] p-4">
            <h3 className="text-sm font-semibold mb-3">Top Scorers</h3>
            <div className="divide-y divide-[#1E1E1E]">
              {playerStats.topScorers.slice(0, 5).map((scorer, i) => (
                <div key={`${i}-${scorer.name}`} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-[#9E9E9E] tabular-nums text-right">{scorer.rank}</span>
                    <div>
                      <div className="font-medium">{scorer.name}</div>
                      <div className="text-xs text-[#9E9E9E]">{scorer.team}</div>
                    </div>
                  </div>
                  <div className="tabular-nums font-semibold">{scorer.goals}</div>
                </div>
              ))}
              {playerStats.topScorers.length === 0 && (
                <div className="py-4 text-sm text-[#9E9E9E]">No goals yet</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-[#141414] p-4">
            <h3 className="text-sm font-semibold mb-3">Top Assists</h3>
            <div className="divide-y divide-[#1E1E1E]">
              {playerStats.topAssists.slice(0, 5).map((assister, i) => (
                <div key={`${i}-${assister.name}`} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-[#9E9E9E] tabular-nums text-right">{assister.rank}</span>
                    <div>
                      <div className="font-medium">{assister.name}</div>
                      <div className="text-xs text-[#9E9E9E]">{assister.team}</div>
                    </div>
                  </div>
                  <div className="tabular-nums font-semibold">{assister.assists}</div>
                </div>
              ))}
              {playerStats.topAssists.length === 0 && (
                <div className="py-4 text-sm text-[#9E9E9E]">No assists yet</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-[#141414] p-4">
            <h3 className="text-sm font-semibold mb-3">Discipline</h3>
            <div className="divide-y divide-[#1E1E1E]">
              {playerStats.discipline.slice(0, 5).map((player, i) => (
                <div key={`${i}-${player.name}`} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-[#9E9E9E]">{player.team}</div>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    {player.yellow_cards > 0 && (
                      <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-xs font-medium">{player.yellow_cards} 🟨</span>
                    )}
                    {player.red_cards > 0 && (
                      <span className="px-2 py-0.5 rounded bg-rose-600/20 text-rose-300 text-xs font-medium">{player.red_cards} 🟥</span>
                    )}
                  </div>
                </div>
              ))}
              {playerStats.discipline.length === 0 && (
                <div className="py-4 text-sm text-[#9E9E9E]">No cards yet</div>
              )}
            </div>
          </div>
        </section>

        <div className="text-center text-xs text-[#9E9E9E]">Sorted by points, goal difference, goals scored</div>
      </div>
    </div>
  )
}
