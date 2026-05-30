"use client"

import { useState, useEffect, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getTeamBadge } from "@/lib/badges"
import { cn } from "@/lib/utils"
import { Crown, Medal, Target, Zap, ShieldAlert, Trophy, User } from "lucide-react"

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

function computeForm(fixtures: any[]) {
  const acc = new Map<string, { md: number; r: "W" | "D" | "L" }[]>()
  for (const f of fixtures) {
    if (String(f.status || "").toUpperCase() !== "PLAYED") continue
    const home = String(f.homePlayer)
    const away = String(f.awayPlayer)
    const hs = Number(f.homeScore ?? 0)
    const as = Number(f.awayScore ?? 0)
    const md = Number(f.matchday || 0)
    if (Number.isNaN(hs) || Number.isNaN(as)) continue
    const homeR: "W" | "D" | "L" = hs > as ? "W" : hs < as ? "L" : "D"
    const awayR: "W" | "D" | "L" = as > hs ? "W" : as < hs ? "L" : "D"
    if (!acc.has(home)) acc.set(home, [])
    if (!acc.has(away)) acc.set(away, [])
    acc.get(home)!.push({ md, r: homeR })
    acc.get(away)!.push({ md, r: awayR })
  }
  const out = new Map<string, ("W" | "D" | "L")[]>()
  for (const [k, v] of acc) {
    out.set(k, v.sort((a, b) => a.md - b.md).slice(-5).map((e) => e.r))
  }
  return out
}

function FormDots({ results }: { results?: ("W" | "D" | "L")[] }) {
  const slots: (string)[] = [...(results ?? []).slice(-5)]
  while (slots.length < 5) slots.unshift("")
  return (
    <div className="flex items-center gap-1">
      {slots.map((res, i) => (
        <span
          key={i}
          title={res || "—"}
          className={cn(
            "h-2 w-2 rounded-full",
            res === "W" && "bg-emerald-500",
            res === "D" && "bg-amber-500",
            res === "L" && "bg-rose-500",
            !res && "bg-[#262626]",
          )}
        />
      ))}
    </div>
  )
}

function TeamBadge({ team }: { team?: string | null }) {
  const url = getTeamBadge(team)
  if (url) {
    return <img src={url} alt="" className="h-5 w-5 mr-2 rounded-full bg-[#0F0F0F] border border-[#1E1E1E] object-contain" />
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#1E1E1E] bg-[#0F0F0F] text-[#5C5C5C] mr-2">
      <User className="h-3 w-3" aria-hidden />
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
        // The tournaments list is the source of truth: a tournament becomes
        // live once it's activated (status ACTIVE).
        const { tournaments = [] } = await fetch("/api/admin/tournaments")
          .then((r) => r.json())
          .catch(() => ({ tournaments: [] }))
        const active = tournaments.find((t: any) => t.status === "ACTIVE") ?? null
        setActiveTournament(active)
        setActiveTournamentId(active?.id ?? null)
      } catch {
        setActiveTournament(null)
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

  const completed = useMemo(() => fixtures.filter((f: any) => {
    const status = String(f.status || "").toUpperCase();
    return status === "PLAYED" || status === "FORFEIT";
  }), [fixtures]);

  const lastCompleted = useMemo(() => {
    const completedMds = completed.map(f => f.matchday).filter(Boolean);
    return completedMds.length > 0 ? Math.max(...completedMds) : 0;
  }, [completed]);

  const upcoming = useMemo(() => fixtures.filter((f: any) => {
    const status = String(f.status || "").toUpperCase();
    return status !== "PLAYED" && status !== "CANCELLED" && status !== "FORFEIT";
  }), [fixtures]);

  const cancelled = useMemo(() => fixtures.filter((f: any) => String(f.status || "").toUpperCase() === "CANCELLED"), [fixtures]);
  const forfeit = useMemo(() => fixtures.filter((f: any) => String(f.status || "").toUpperCase() === "FORFEIT"), [fixtures]);
  const formGuide = useMemo(() => computeForm(fixtures), [fixtures]);
  console.log("Standings page: Fixture counts - Total:", fixtures.length, "Completed:", completed.length, "Upcoming:", upcoming.length, "Cancelled:", cancelled.length, "Forfeit:", forfeit.length, "Last completed matchday:", lastCompleted)

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
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="container-5xl section-pad space-y-6 px-4 md:px-0">
          <Skeleton className="h-9 w-56 bg-[#161616]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 w-full rounded-2xl bg-[#161616]" />
            <Skeleton className="h-28 w-full rounded-2xl bg-[#161616]" />
            <Skeleton className="h-28 w-full rounded-2xl bg-[#161616]" />
          </div>
          <Skeleton className="h-72 w-full rounded-2xl bg-[#161616]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-56 w-full rounded-2xl bg-[#161616]" />
            <Skeleton className="h-56 w-full rounded-2xl bg-[#161616]" />
            <Skeleton className="h-56 w-full rounded-2xl bg-[#161616]" />
          </div>
        </div>
      </div>
    )
  }

  const podium = standings.slice(0, 3)
  const consoles = [
    { value: "all", label: "All" },
    { value: "PS5", label: "PS5" },
    { value: "XBOX", label: "Xbox" },
    { value: "PC", label: "PC" },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
      </div>

      <div className="relative container-5xl section-pad space-y-8 px-4 md:px-0">
        {/* HEADER */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              <Trophy className="h-3 w-3" /> League Table
            </span>
            <h1 className="mt-3 font-heading text-3xl text-white md:text-4xl">Standings</h1>
            {activeTournament ? (
              <p className="mt-1 text-sm text-[#9E9E9E]">
                <span className="font-semibold text-white">{activeTournament.name}</span>
                {activeTournament.start_at && ` · ${new Date(activeTournament.start_at).toLocaleDateString()}`}
                {activeTournament.end_at && ` → ${new Date(activeTournament.end_at).toLocaleDateString()}`}
              </p>
            ) : (
              <p className="mt-1 text-sm text-[#9E9E9E]">Weekend FC League</p>
            )}
          </div>

          <div className="inline-flex rounded-lg border border-[#1E1E1E] bg-[#111111] p-1">
            {consoles.map((c) => (
              <button
                key={c.value}
                onClick={() => setConsoleFilter(c.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                  consoleFilter === c.value ? "bg-emerald-500 text-black" : "text-[#8A8A8A] hover:text-white",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </header>

        {!activeTournamentId && (
          <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1A1A]">
              <Trophy className="h-6 w-6 text-[#5C5C5C]" />
            </div>
            <div className="font-heading text-lg text-white">No active tournament</div>
            <div className="mt-1 text-sm text-[#9E9E9E]">Check back when a tournament kicks off.</div>
          </div>
        )}

        {activeTournamentId && (
          <>
            {/* PODIUM */}
            {podium.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {podium.map((row, i) => {
                  const tiers = [
                    { ring: "border-amber-400/60", grad: "from-amber-500/15", text: "text-amber-300", chip: "bg-amber-400/15 text-amber-200" },
                    { ring: "border-slate-300/40", grad: "from-slate-300/10", text: "text-slate-200", chip: "bg-slate-300/10 text-slate-200" },
                    { ring: "border-orange-700/50", grad: "from-orange-800/15", text: "text-orange-300", chip: "bg-orange-700/15 text-orange-300" },
                  ]
                  const t = tiers[i]
                  return (
                    <div
                      key={row.id || i}
                      className={cn(
                        "fut-shine relative overflow-hidden rounded-2xl border bg-gradient-to-b to-[#101010] p-4",
                        t.ring,
                        t.grad,
                      )}
                    >
                      <div className="relative z-10 flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border", t.ring)}>
                          {i === 0 ? <Crown className={cn("h-5 w-5", t.text)} /> : <Medal className={cn("h-5 w-5", t.text)} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center">
                            <TeamBadge team={row.team} />
                            <span className="truncate font-heading text-base text-white">{row.name}</span>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-[#9E9E9E]">{row.team}</div>
                        </div>
                        <div className="text-right">
                          <div className={cn("font-heading text-2xl leading-none", t.text)}>{row.points}</div>
                          <div className="text-[9px] font-bold uppercase tracking-widest text-[#7A7A7A]">Pts</div>
                        </div>
                      </div>
                      <div className="relative z-10 mt-3 flex items-center justify-between">
                        <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", t.chip)}>
                          {i === 0 ? "Leader" : `#${i + 1}`}
                        </span>
                        <FormDots results={formGuide.get(String(row.id))} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* LEAGUE TABLE */}
            <section className="overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
              <div className="flex items-center justify-between border-b border-[#1E1E1E] px-4 py-3">
                <h2 className="font-heading text-sm text-white">League Table</h2>
                <span className="text-xs text-[#9E9E9E]">{standings.length} players</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-[#7A7A7A]">
                      <th className="px-3 py-2 text-left font-bold">#</th>
                      <th className="px-3 py-2 text-left font-bold">Player</th>
                      <th className="px-3 py-2 text-left font-bold">Form</th>
                      <th className="px-3 py-2 text-right font-bold">P</th>
                      <th className="px-3 py-2 text-right font-bold">W</th>
                      <th className="px-3 py-2 text-right font-bold">D</th>
                      <th className="px-3 py-2 text-right font-bold">L</th>
                      <th className="px-3 py-2 text-right font-bold">GF</th>
                      <th className="px-3 py-2 text-right font-bold">GA</th>
                      <th className="px-3 py-2 text-right font-bold">GD</th>
                      <th className="px-3 py-2 text-right font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, idx) => {
                      const rank = idx + 1
                      const rankColor =
                        rank === 1 ? "text-amber-300" : rank === 2 ? "text-slate-200" : rank === 3 ? "text-orange-300" : "text-[#9E9E9E]"
                      return (
                        <tr
                          key={s.id}
                          className={cn(
                            "border-t border-[#1A1A1A] transition-colors hover:bg-white/[0.025]",
                            rank <= 3 && "bg-emerald-500/[0.03]",
                          )}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className={cn("h-6 w-1 rounded-full", rank <= 3 ? "bg-emerald-500" : "bg-transparent")} />
                              <span className={cn("font-heading tabular-nums", rankColor)}>{rank}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center">
                              <TeamBadge team={s.team} />
                              <span className="font-medium text-white">{s.name}</span>
                            </div>
                            <div className="ml-7 text-[11px] text-[#7A7A7A]">{s.team}</div>
                          </td>
                          <td className="px-3 py-2.5"><FormDots results={formGuide.get(String(s.id))} /></td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-[#D1D1D1]">{s.played}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-emerald-400">{s.won}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-amber-400">{s.drawn}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-rose-400">{s.lost}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-[#D1D1D1]">{s.goals_for}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-[#D1D1D1]">{s.goals_against}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            <span className={s.goal_difference >= 0 ? "text-emerald-400" : "text-rose-400"}>
                              {s.goal_difference > 0 ? "+" : ""}{s.goal_difference}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="font-heading text-base text-white tabular-nums">{s.points}</span>
                          </td>
                        </tr>
                      )
                    })}
                    {standings.length === 0 && (
                      <tr>
                        <td className="px-3 py-8 text-center text-sm text-[#7A7A7A]" colSpan={11}>
                          No standings yet — play some matches to climb the table.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* FIXTURES */}
            <section className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 md:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex rounded-lg border border-[#1E1E1E] bg-[#0D0D0D] p-1">
                  <button
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                      tab === "UPCOMING" ? "bg-emerald-500 text-black" : "text-[#8A8A8A] hover:text-white",
                    )}
                    onClick={() => setTab("UPCOMING")}
                  >
                    Upcoming ({upcoming.length})
                  </button>
                  <button
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                      tab === "COMPLETED" ? "bg-emerald-500 text-black" : "text-[#8A8A8A] hover:text-white",
                    )}
                    onClick={() => setTab("COMPLETED")}
                  >
                    Completed ({completed.length})
                  </button>
                </div>
                {shownRaw.length > 8 && (
                  <button
                    className="text-xs font-bold uppercase tracking-wider text-emerald-400 hover:underline"
                    onClick={() => setShowAll((v) => !v)}
                  >
                    {showAll ? "Show less" : "Show all"}
                  </button>
                )}
              </div>

              {groups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#222] py-10 text-center text-sm text-[#7A7A7A]">
                  {tab === "COMPLETED" ? "No completed fixtures yet." : "No upcoming fixtures."}
                </div>
              ) : (
                <div className="space-y-5">
                  {groups.map((g) => (
                    <div key={g.md}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-[#0D0D0D] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">
                          Matchday {g.md}
                        </span>
                        <span className="text-[11px] text-[#6A6A6A]">{formatDateRange(g.dates)}</span>
                        <div className="h-px flex-1 bg-[#1A1A1A]" />
                      </div>
                      <div className="space-y-2">
                        {g.items.map((f: any) => {
                          const isPlayed = String(f.status || "").toUpperCase() === "PLAYED"
                          const hs = Number(f.homeScore ?? 0)
                          const as = Number(f.awayScore ?? 0)
                          const draw = isPlayed && hs === as
                          const homeWin = isPlayed && hs > as
                          const awayWin = isPlayed && as > hs
                          return (
                            <div key={f.id} className="overflow-hidden rounded-xl border border-[#1E1E1E] bg-[#0D0D0D]">
                              <button
                                onClick={() => setExpandedId((id) => (id === f.id ? null : f.id))}
                                className="w-full px-3 py-3 text-left transition-colors hover:bg-white/[0.02]"
                              >
                                <div className="grid grid-cols-12 items-center gap-2">
                                  <div className="col-span-5 flex items-center truncate">
                                    <TeamBadge team={f.homeTeam} />
                                    <span className={cn("truncate text-sm", homeWin ? "font-semibold text-white" : "text-[#D1D1D1]")}>
                                      {f.homeLabel}
                                    </span>
                                  </div>
                                  <div className="col-span-2 text-center">
                                    {isPlayed ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-[#141414] px-2 py-1 font-heading tabular-nums">
                                        <span className={draw ? "text-amber-300" : homeWin ? "text-emerald-400" : "text-[#7A7A7A]"}>{hs}</span>
                                        <span className="text-[#4A4A4A]">:</span>
                                        <span className={draw ? "text-amber-300" : awayWin ? "text-emerald-400" : "text-[#7A7A7A]"}>{as}</span>
                                      </span>
                                    ) : (
                                      <span className="rounded-md bg-[#141414] px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#7A7A7A]">
                                        {formatTime(f.scheduledDate)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="col-span-5 flex items-center justify-end truncate">
                                    <span className={cn("truncate text-right text-sm", awayWin ? "font-semibold text-white" : "text-[#D1D1D1]")}>
                                      {f.awayLabel}
                                    </span>
                                    <TeamBadge team={f.awayTeam} />
                                  </div>
                                </div>
                              </button>
                              {expandedId === f.id && (
                                <div className="border-t border-[#1A1A1A] bg-[#0A0A0A] px-3 py-2 text-xs text-[#9E9E9E]">
                                  <span>Matchday {f.matchday} · {isPlayed ? "Completed" : `Kickoff ${formatTime(f.scheduledDate)}`}</span>
                                  {isPlayed && <span className="ml-3">Score {hs}–{as}</span>}
                                  {f.notes && <div className="mt-1">Notes: {f.notes}</div>}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* STATS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-heading text-sm text-white">Top Scorers</h3>
                </div>
                <div className="divide-y divide-[#1A1A1A]">
                  {playerStats.topScorers.slice(0, 5).map((scorer, i) => (
                    <div key={`${i}-${scorer.name}`} className="flex items-center gap-3 py-2 text-sm">
                      <span className="w-5 text-right font-heading text-xs tabular-nums text-[#7A7A7A]">{scorer.rank}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-white">{scorer.name}</div>
                        <div className="truncate text-xs text-[#7A7A7A]">{scorer.team}</div>
                      </div>
                      <span className="font-heading tabular-nums text-emerald-400">{scorer.goals}</span>
                    </div>
                  ))}
                  {playerStats.topScorers.length === 0 && <div className="py-6 text-center text-sm text-[#7A7A7A]">No goals yet</div>}
                </div>
              </div>

              <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-sky-400" />
                  <h3 className="font-heading text-sm text-white">Top Assists</h3>
                </div>
                <div className="divide-y divide-[#1A1A1A]">
                  {playerStats.topAssists.slice(0, 5).map((assister, i) => (
                    <div key={`${i}-${assister.name}`} className="flex items-center gap-3 py-2 text-sm">
                      <span className="w-5 text-right font-heading text-xs tabular-nums text-[#7A7A7A]">{assister.rank}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-white">{assister.name}</div>
                        <div className="truncate text-xs text-[#7A7A7A]">{assister.team}</div>
                      </div>
                      <span className="font-heading tabular-nums text-sky-400">{assister.assists}</span>
                    </div>
                  ))}
                  {playerStats.topAssists.length === 0 && <div className="py-6 text-center text-sm text-[#7A7A7A]">No assists yet</div>}
                </div>
              </div>

              <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <h3 className="font-heading text-sm text-white">Discipline</h3>
                </div>
                <div className="divide-y divide-[#1A1A1A]">
                  {playerStats.discipline.slice(0, 5).map((player, i) => (
                    <div key={`${i}-${player.name}`} className="flex items-center gap-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-white">{player.name}</div>
                        <div className="truncate text-xs text-[#7A7A7A]">{player.team}</div>
                      </div>
                      <div className="flex items-center gap-1.5 tabular-nums">
                        {player.yellow_cards > 0 && (
                          <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs font-bold text-yellow-300">
                            {player.yellow_cards}
                          </span>
                        )}
                        {player.red_cards > 0 && (
                          <span className="rounded bg-rose-600/25 px-1.5 py-0.5 text-xs font-bold text-rose-300">
                            {player.red_cards}
                          </span>
                        )}
                        {player.yellow_cards === 0 && player.red_cards === 0 && (
                          <span className="text-xs text-[#5A5A5A]">clean</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {playerStats.discipline.length === 0 && <div className="py-6 text-center text-sm text-[#7A7A7A]">No cards yet</div>}
                </div>
              </div>
            </section>
          </>
        )}

        <p className="text-center text-xs text-[#6A6A6A]">Sorted by points, goal difference, then goals scored.</p>
      </div>
    </div>
  )
}
