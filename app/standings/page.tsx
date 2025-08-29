"use client"

import { useState, useEffect, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTeamBadge } from "@/lib/badges"

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

function formatDateRange(dates: Date[]) {
  if (dates.length === 0) return ""
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const short = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
  if (first.toDateString() === last.toDateString()) return short.format(first)
  return `${short.format(first)}–${short.format(last)}`
}

function formatTime(dt?: string | null) {
  if (!dt) return "TBD"
  try {
    return new Date(dt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  } catch { return "TBD" }
}

function TeamBadge({ team }: { team?: string | null }) {
  const url = getTeamBadge(team)
  if (url) {
    return <img src={url} alt="" className="h-5 w-5 mr-2 rounded-full bg-[#0F0F0F] border border-[#1E1E1E] object-contain" />
  }
  const init = (team || "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("") || ""
  return (
    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-[#1E1E1E] bg-[#0F0F0F] text-[10px] mr-2">
      {init}
    </span>
  )
}

export default function StandingsPage() {
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ topScorers: [], topAssists: [], discipline: [] })
  const [fixtures, setFixtures] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [consoleFilter, setConsoleFilter] = useState("all")
  const [tab, setTab] = useState<"UPCOMING" | "COMPLETED">("UPCOMING")
  const [activeTournamentId, setActiveTournamentId] = useState<string | null | undefined>(undefined)
  const [activeTournament, setActiveTournament] = useState<any>(null)
  const [showAll, setShowAll] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const loadActive = async () => {
      try {
        // First try to get from settings
        const s = await fetch("/api/admin/settings").then((r) => r.json())
        let tournamentId = s?.tournament?.active_tournament_id
        
        // If not found in settings, get active tournament directly
        if (!tournamentId) {
          try {
            const tournamentsRes = await fetch("/api/admin/tournaments").then((r) => r.json()).catch(() => ({ tournaments: [] }))
            const activeTournament = tournamentsRes.tournaments?.find((t: any) => t.status === "ACTIVE")
            tournamentId = activeTournament?.id
            setActiveTournament(activeTournament || null)
            console.log("Standings page: Found active tournament:", tournamentId)
          } catch (e) {
            console.error("Error fetching active tournament:", e)
          }
        } else {
          // If we have tournamentId from settings, get the tournament details
          try {
            const tournamentsRes = await fetch("/api/admin/tournaments").then((r) => r.json()).catch(() => ({ tournaments: [] }))
            const tournament = tournamentsRes.tournaments?.find((t: any) => t.id === tournamentId)
            setActiveTournament(tournament || null)
          } catch (e) {
            console.error("Error fetching tournament details:", e)
          }
        }
        
        setActiveTournamentId(tournamentId ?? null)
      } catch { 
        setActiveTournamentId(null) 
      }
    }
    loadActive()
  }, [])

  useEffect(() => {
    // Only skip while unknown (undefined). If null, still fetch to show mock/fallback data.
    if (activeTournamentId === undefined) return
    fetchData()
  }, [consoleFilter, activeTournamentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("Standings page: Fetching data for tournament:", activeTournamentId)
      const qs = activeTournamentId ? `?tournamentId=${encodeURIComponent(String(activeTournamentId))}` : ""
      const standingsUrl = consoleFilter === "all" ? `/api/standings${qs}` : `/api/standings${qs ? `${qs}&` : "?"}console=${consoleFilter}`
      const playerStatsUrl = `/api/player-stats${qs}`
      const fixturesUrl = `/api/fixtures${qs}`
      const [standingsResponse, statsResponse, fixturesResponse] = await Promise.all([
        fetch(standingsUrl),
        fetch(playerStatsUrl),
        fetch(fixturesUrl),
      ])

      // Also fetch players for team names
      let byId: Map<string, any> = new Map()
      try {
        const playersResponse = await fetch("/api/admin/players")
        if (playersResponse.ok) {
          const pj = await playersResponse.json()
          byId = new Map((pj.players || []).map((p: any) => [String(p.id), p]))
        }
      } catch {}
      setPlayers(Array.from(byId.values()))

      if (standingsResponse.ok) {
        const data = await standingsResponse.json()
        console.log("Standings page: Standings data:", data)
        const rows = (data.standings || []).map((s: any) => {
          const id = s.playerId || s.id || ""
          const fallbackTeam = byId.get(String(id))?.preferred_club || s.club || s.preferred_club || s.assigned_club || "-"
          return {
            id,
            name: s.playerName || s.name,
            team: s.team || fallbackTeam,
            played: s.played || 0,
            won: s.won || 0,
            drawn: s.drawn || 0,
            lost: s.lost || 0,
            goals_for: s.goalsFor || s.goals_for || 0,
            goals_against: s.goalsAgainst || s.goals_against || 0,
            goal_difference: s.goalDifference || s.goal_difference || 0,
            points: s.points || 0,
          } as StandingRow
        })
        setStandings(rows)
        console.log("Standings page: Mapped standings rows:", rows.length)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData) {
          const ts = Array.isArray(statsData.topScorers) ? statsData.topScorers.map((r: any, i: number) => ({ rank: r.rank || i + 1, name: r.name || r.player || r.player_name || r.playerName, team: r.team || r.club || r.preferred_club || "-", goals: r.goals || r.G || 0 })) : []
          const ta = Array.isArray(statsData.topAssists) ? statsData.topAssists.map((r: any, i: number) => ({ rank: r.rank || i + 1, name: r.name || r.player || r.player_name || r.playerName, team: r.team || r.club || r.preferred_club || "-", assists: r.assists || r.A || 0 })) : []
          const td = Array.isArray(statsData.discipline) ? statsData.discipline.map((r: any) => ({ name: r.name || r.player || r.player_name || r.playerName, team: r.team || r.club || r.preferred_club || "-", yellow_cards: r.yellow_cards || r.YC || 0, red_cards: r.red_cards || r.RC || 0 })) : []
          setPlayerStats({ topScorers: ts, topAssists: ta, discipline: td })
        }
      }

      if (fixturesResponse.ok) {
        const f = await fixturesResponse.json()
        console.log("Standings page: Fixtures data:", f.fixtures?.length || 0)
        
        // Map player IDs to names using the players data
        const allFixtures = (f.fixtures || []).map((fx: any) => {
          const homePlayer = byId.get(String(fx.homePlayer))
          const awayPlayer = byId.get(String(fx.awayPlayer))
          
          return {
            ...fx,
            // Map player IDs to names
            homeName: homePlayer?.name || fx.homePlayer,
            awayName: awayPlayer?.name || fx.awayPlayer,
            homeTeam: homePlayer?.preferred_club || "-",
            awayTeam: awayPlayer?.preferred_club || "-",
            // Ensure names/teams always present for UI
            homeLabel: `${homePlayer?.name || fx.homePlayer}${homePlayer?.preferred_club ? ` (${homePlayer.preferred_club})` : ""}`,
            awayLabel: `${awayPlayer?.name || fx.awayPlayer}${awayPlayer?.preferred_club ? ` (${awayPlayer.preferred_club})` : ""}`,
          }
        })
        setFixtures(allFixtures)
        console.log("Standings page: Mapped fixtures with player names:", allFixtures.length)
        try {
          const goals = new Map<string, { name: string; team: string; goals: number }>()
          for (const fx of allFixtures) {
            const played = String(fx.status || "").toUpperCase() === "PLAYED"
            if (!played) continue
            const hid = String(fx.homePlayer)
            const aid = String(fx.awayPlayer)
            const hName = fx.homeName || hid
            const aName = fx.awayName || aid
            const hTeam = fx.homeTeam || byId.get(hid)?.preferred_club || "-"
            const aTeam = fx.awayTeam || byId.get(aid)?.preferred_club || "-"
            const hGoals = Number(fx.homeScore ?? 0)
            const aGoals = Number(fx.awayScore ?? 0)
            if (!Number.isNaN(hGoals)) {
              const cur = goals.get(hid) || { name: hName, team: hTeam, goals: 0 }
              cur.name = hName; cur.team = hTeam; cur.goals += hGoals
              goals.set(hid, cur)
            }
            if (!Number.isNaN(aGoals)) {
              const cur = goals.get(aid) || { name: aName, team: aTeam, goals: 0 }
              cur.name = aName; cur.team = aTeam; cur.goals += aGoals
              goals.set(aid, cur)
            }
          }
          const computed = Array.from(goals.values()).sort((a, b) => b.goals - a.goals).map((r, i) => ({ rank: i + 1, name: r.name, team: r.team, goals: r.goals }))
          if (computed.length > 0 && (playerStats.topScorers?.length || 0) === 0) {
            setPlayerStats((prev) => ({ ...prev, topScorers: computed }))
          }
        } catch {}
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const completed = useMemo(() => fixtures.filter((f: any) => String(f.status || "").toUpperCase() === "PLAYED"), [fixtures]);

  const lastCompleted = useMemo(() => {
    const completedMds = completed.map(f => f.matchday).filter(Boolean);
    return completedMds.length > 0 ? Math.max(...completedMds) : 0;
  }, [completed]);

  const upcoming = useMemo(() => fixtures.filter((f: any) => String(f.status || "").toUpperCase() !== "PLAYED"), [fixtures]);

  console.log("Standings page: Fixture counts - Total:", fixtures.length, "Completed:", completed.length, "Upcoming:", upcoming.length, "Last completed matchday:", lastCompleted)

  const shownRaw = tab === "UPCOMING" ? upcoming : completed
  const shown = showAll ? shownRaw : shownRaw.slice(0, 8)

  const groups = useMemo(() => {
    const entries = new Map<string, { md: number; dates: Date[]; items: any[] }>()
    for (const fx of shown) {
      const key = String(fx.matchday || "?")
      const rec = entries.get(key) || { md: Number(fx.matchday || 0), dates: [], items: [] }
      if (fx.scheduledDate) rec.dates.push(new Date(fx.scheduledDate))
      rec.items.push(fx)
      entries.set(key, rec)
    }
    return Array.from(entries.values()).sort((a, b) => a.md - b.md)
  }, [shown])

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
            {activeTournament ? (
              <div className="text-sm text-[#9E9E9E]">
                <div className="font-medium text-white">{activeTournament.name}</div>
                <div>
                  {activeTournament.start_at && new Date(activeTournament.start_at).toLocaleDateString()} 
                  {activeTournament.end_at && ` → ${new Date(activeTournament.end_at).toLocaleDateString()}`}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#9E9E9E]">Weekend FC League</p>
            )}
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

        {!activeTournamentId && (
          <div className="rounded-2xl border p-8 bg-[#141414] text-center">
            <div className="text-lg font-semibold mb-2">No Active Tournament</div>
            <div className="text-sm text-[#9E9E9E]">All tournaments are currently inactive. Check back when a tournament is active.</div>
          </div>
        )}

        {activeTournamentId && (
          <>
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
            <div>
              <button className={`px-2 py-0.5 rounded ${tab === "UPCOMING" ? "bg-emerald-500 text-white" : ""}`} onClick={() => setTab("UPCOMING")}>Upcoming ({upcoming.length})</button>
              <button className={`px-2 py-0.5 rounded ml-1 ${tab === "COMPLETED" ? "bg-emerald-500 text-white" : ""}`} onClick={() => setTab("COMPLETED")}>Completed ({completed.length})</button>
            </div>
            <button className="text-xs text-[#9E9E9E] underline" onClick={() => setShowAll((v) => !v)}>{showAll ? "Show less" : "Show all"}</button>
          </div>

          {groups.length === 0 ? (
            <div className="text-sm text-[#9E9E9E]">{tab === "COMPLETED" ? "No completed fixtures." : "No fixtures."}</div>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g.md}>
                  <div className="px-2 py-1 text-xs uppercase tracking-wide text-[#9E9E9E] bg-[#0F0F0F] rounded mb-1 border border-[#1E1E1E]">Matchday {g.md} — {formatDateRange(g.dates)}</div>
                  <ul className="">
                    {g.items.map((f, i) => {
                      const isPlayed = String(f.status || "").toUpperCase() === "PLAYED"
                      const hs = Number(f.homeScore ?? 0)
                      const as = Number(f.awayScore ?? 0)
                      const draw = isPlayed && hs === as
                      const homeWin = isPlayed && hs > as
                      const awayWin = isPlayed && as > hs
                      const rowBg = i % 2 === 0 ? "bg-[#141414]" : "bg-[#121212]"
                      return (
                        <li key={f.id} className={`${rowBg} border-t first:border-t-0 border-[#1E1E1E] p-3`}>
                          <button onClick={() => setExpandedId((id) => (id === f.id ? null : f.id))} className="w-full text-left">
                            <div className="grid grid-cols-12 items-center gap-2">
                              <div className="col-span-5 flex items-center truncate">
                                <TeamBadge team={f.homeTeam} />
                                <span className="truncate">{f.homeLabel}</span>
                              </div>
                              <div className="col-span-2 text-center font-semibold tabular-nums">
                                {isPlayed ? (
                                  <span>
                                    <span className={`${draw ? "text-yellow-300" : homeWin ? "text-emerald-400" : "text-[#9E9E9E]"}`}>{hs}</span>
                                    <span className="mx-1">–</span>
                                    <span className={`${draw ? "text-yellow-300" : awayWin ? "text-emerald-400" : "text-[#9E9E9E]"}`}>{as}</span>
                                  </span>
                                ) : (
                                  <span className="text-[#9E9E9E]">TBD</span>
                                )}
                              </div>
                              <div className="col-span-5 flex items-center justify-end truncate">
                                <span className="truncate">{f.awayLabel}</span>
                                <TeamBadge team={f.awayTeam} />
                              </div>
                            </div>
                            <div className="mt-1 text-xs text-[#9E9E9E]">
                              {isPlayed ? (
                                <span>Matchday {f.matchday} · Completed</span>
                              ) : (
                                <span>Matchday {f.matchday} · Kickoff: {formatTime(f.scheduledDate)}</span>
                              )}
                            </div>
                          </button>
                          {expandedId === f.id && (
                            <div className="mt-2 text-xs text-[#D1D1D1] space-y-1">
                              <div>Venue: <span className="text-[#9E9E9E]">{f.homeLabel} (Home)</span></div>
                              {isPlayed && <div>Reported score: <span className="text-[#9E9E9E]">{hs}–{as}</span></div>}
                              {f.notes && <div>Notes: <span className="text-[#9E9E9E]">{f.notes}</span></div>}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
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

            </>
          )}

        <div className="text-center text-xs text-[#9E9E9E]">Sorted by points, goal difference, goals scored</div>
      </div>
    </div>
  )
}
