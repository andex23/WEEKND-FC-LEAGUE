"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter } from "lucide-react"

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
      // Fetch standings
      const standingsUrl = consoleFilter === "all" ? "/api/standings" : `/api/standings?console=${consoleFilter}`
      const standingsResponse = await fetch(standingsUrl)
      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json()
        setStandings(standingsData.standings || [])
      }

      // Fetch player stats
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading standings...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-4xl font-black text-gray-900 mb-2">League Standings</h1>
              <p className="text-gray-500">Weeknd FC League - FIFA 25</p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
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
        </div>

        {/* Standings Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 font-semibold text-gray-900">Pos</th>
                  <th className="font-semibold text-gray-900">Player</th>
                  <th className="font-semibold text-gray-900">Team</th>
                  <th className="text-center font-semibold text-gray-900">P</th>
                  <th className="text-center font-semibold text-gray-900">W</th>
                  <th className="text-center font-semibold text-gray-900">D</th>
                  <th className="text-center font-semibold text-gray-900">L</th>
                  <th className="text-center font-semibold text-gray-900">GF</th>
                  <th className="text-center font-semibold text-gray-900">GA</th>
                  <th className="text-center font-semibold text-gray-900">GD</th>
                  <th className="text-center font-semibold text-gray-900">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr
                    key={standing.id}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b border-gray-100`}
                  >
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        {index + 1 === 1 && <span className="text-lg">🥇</span>}
                        {index + 1 === 2 && <span className="text-lg">🥈</span>}
                        {index + 1 === 3 && <span className="text-lg">🥉</span>}
                        {index + 1}
                      </div>
                    </td>
                    <td className="font-medium text-gray-900">{standing.name}</td>
                    <td className="text-gray-600">{standing.team}</td>
                    <td className="text-center">{standing.played}</td>
                    <td className="text-center">{standing.won}</td>
                    <td className="text-center">{standing.drawn}</td>
                    <td className="text-center">{standing.lost}</td>
                    <td className="text-center">{standing.goals_for}</td>
                    <td className="text-center">{standing.goals_against}</td>
                    <td className="text-center">
                      <span className={standing.goal_difference >= 0 ? "text-green-600" : "text-red-600"}>
                        {standing.goal_difference > 0 ? "+" : ""}
                        {standing.goal_difference}
                      </span>
                    </td>
                    <td className="text-center font-bold text-lg">{standing.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Player Stats Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Scorers */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Top Scorers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {playerStats.topScorers.length > 0 ? (
                  playerStats.topScorers.map((scorer, index) => (
                    <div
                      key={`scorer-${index}-${scorer.name}-${scorer.team}`}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {scorer.rank}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">{scorer.name}</div>
                          <div className="text-sm text-gray-500">{scorer.team}</div>
                        </div>
                      </div>
                      <div className="font-bold text-lg text-gray-900">{scorer.goals}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No goals scored yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Assists */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Top Assists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {playerStats.topAssists.length > 0 ? (
                  playerStats.topAssists.map((assister, index) => (
                    <div
                      key={`assister-${index}-${assister.name}-${assister.team}`}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {assister.rank}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">{assister.name}</div>
                          <div className="text-sm text-gray-500">{assister.team}</div>
                        </div>
                      </div>
                      <div className="font-bold text-lg text-gray-900">{assister.assists}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No assists recorded yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Discipline */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Discipline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {playerStats.discipline.length > 0 ? (
                  playerStats.discipline.map((player, index) => (
                    <div
                      key={`discipline-${index}-${player.name}-${player.team}`}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{player.name}</div>
                        <div className="text-sm text-gray-500">{player.team}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {player.yellow_cards > 0 && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                            {player.yellow_cards} 🟨
                          </span>
                        )}
                        {player.red_cards > 0 && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                            {player.red_cards} 🟥
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No cards issued yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-sm text-gray-500 text-center">
          <p>🥇 Champion • 🥈🥉 Podium • Sorted by points, goal difference, goals scored</p>
        </div>
      </div>
    </div>
  )
}
