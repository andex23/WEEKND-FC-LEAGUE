"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Standing {
  id: string
  name: string
  team: string
  console: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  isCurrentPlayer?: boolean
}

interface PlayerStats {
  topScorers: Array<{
    rank: number
    name: string
    team: string
    goals: number
  }>
  topAssists: Array<{
    rank: number
    name: string
    team: string
    assists: number
  }>
  discipline: Array<{
    name: string
    team: string
    yellow_cards: number
    red_cards: number
  }>
}

export default function StandingsPage() {
  const [standings, setStandings] = useState<Standing[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    topScorers: [],
    topAssists: [],
    discipline: [],
  })
  const [loading, setLoading] = useState(true)
  const [consoleFilter, setConsoleFilter] = useState("all")

  useEffect(() => {
    fetchData()
  }, [consoleFilter])

  const fetchData = async () => {
    try {
      const standingsUrl = consoleFilter === "all" ? "/api/standings" : `/api/standings?console=${consoleFilter}`
      const standingsResponse = await fetch(standingsUrl)
      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json()
        setStandings(standingsData.standings || [])
      }

      const statsResponse = await fetch("/api/player-stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setPlayerStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container-5xl section-pad">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading standings...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-5xl section-pad">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-[36px] md:text-[40px] font-extrabold text-gray-900 mb-1">Standings</h1>
            <p className="text-sm text-gray-500">Weeknd FC League</p>
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
        </div>

        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-gray-700">
                  <th className="text-left px-3 py-2 font-semibold">Pos</th>
                  <th className="text-left px-3 py-2 font-semibold">Player</th>
                  <th className="text-left px-3 py-2 font-semibold">Team</th>
                  <th className="text-right px-3 py-2 font-semibold">P</th>
                  <th className="text-right px-3 py-2 font-semibold">W</th>
                  <th className="text-right px-3 py-2 font-semibold">D</th>
                  <th className="text-right px-3 py-2 font-semibold">L</th>
                  <th className="text-right px-3 py-2 font-semibold">GF</th>
                  <th className="text-right px-3 py-2 font-semibold">GA</th>
                  <th className="text-right px-3 py-2 font-semibold">GD</th>
                  <th className="text-right px-3 py-2 font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr
                    key={standing.id}
                    className={`${index % 2 === 1 ? "bg-gray-50" : "bg-white"} border-t border-gray-100 ${standing.isCurrentPlayer ? "bg-purple-50" : ""}`}
                  >
                    <td className="px-3 py-2 tabular-nums text-gray-900">{index + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{standing.name}</td>
                    <td className="px-3 py-2 text-gray-600">{standing.team}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{standing.played}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{standing.won}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{standing.drawn}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{standing.lost}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{standing.goals_for}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{standing.goals_against}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className={standing.goal_difference >= 0 ? "text-green-600" : "text-red-600"}>
                        {standing.goal_difference > 0 ? "+" : ""}
                        {standing.goal_difference}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-gray-900">{standing.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Scorers</h3>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
              {playerStats.topScorers.slice(0, 5).map((scorer) => (
                <div key={`${scorer.rank}-${scorer.name}`} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-gray-500 tabular-nums text-right">{scorer.rank}</span>
                    <div>
                      <div className="font-medium text-gray-900">{scorer.name}</div>
                      <div className="text-xs text-gray-500">{scorer.team}</div>
                    </div>
                  </div>
                  <div className="tabular-nums font-semibold">{scorer.goals}</div>
                </div>
              ))}
              {playerStats.topScorers.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-500">No goals yet</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Assists</h3>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
              {playerStats.topAssists.slice(0, 5).map((assister, idx) => (
                <div key={`${idx}-${assister.name}`} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-gray-500 tabular-nums text-right">{assister.rank}</span>
                    <div>
                      <div className="font-medium text-gray-900">{assister.name}</div>
                      <div className="text-xs text-gray-500">{assister.team}</div>
                    </div>
                  </div>
                  <div className="tabular-nums font-semibold">{assister.assists}</div>
                </div>
              ))}
              {playerStats.topAssists.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-500">No assists yet</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Discipline</h3>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
              {playerStats.discipline.slice(0, 5).map((player, idx) => (
                <div key={`${idx}-${player.name}`} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{player.name}</div>
                    <div className="text-xs text-gray-500">{player.team}</div>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    {player.yellow_cards > 0 && (
                      <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">{player.yellow_cards} 🟨</span>
                    )}
                    {player.red_cards > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-medium">{player.red_cards} 🟥</span>
                    )}
                  </div>
                </div>
              ))}
              {playerStats.discipline.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-500">No cards yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>Sorted by points, goal difference, goals scored</p>
        </div>
      </div>
    </div>
  )
}
