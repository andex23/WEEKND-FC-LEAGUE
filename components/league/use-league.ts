"use client"
import { useCallback, useEffect, useState } from "react"

export type LeaguePlayer = {
  id: string
  name: string
  preferred_club: string
  assigned_club?: string
  console: string
  avatar_url?: string
}
export type LeagueFixture = {
  id: string
  matchday: number
  homePlayer: string
  awayPlayer: string
  homeTeam?: string
  awayTeam?: string
  homeScore: number | null
  awayScore: number | null
  status: string
  scheduledDate: string | null
  notes?: string
}
export type LeagueStanding = {
  playerId: string
  playerName: string
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  last5?: string[]
}
export type Leader = {
  id: string
  name: string
  team: string
  goals?: number
  assists?: number
  yellow_cards?: number
  red_cards?: number
}
export type LeagueData = {
  active: { id: string; name: string; season?: string } | null
  players: LeaguePlayer[]
  standings: LeagueStanding[]
  fixtures: LeagueFixture[]
  topScorers: Leader[]
  topAssists: Leader[]
  discipline: Leader[]
}
const empty: LeagueData = {
  active: null,
  players: [],
  standings: [],
  fixtures: [],
  topScorers: [],
  topAssists: [],
  discipline: [],
}
export const isFinal = (f: LeagueFixture) => ["PLAYED", "FORFEIT"].includes(f.status.toUpperCase())
export function useLeague() {
  const [data, setData] = useState<LeagueData>(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async (signal?: AbortSignal) => {
    const json = async (path: string) => {
      const r = await fetch(path, { signal: AbortSignal.timeout(15000), cache: "no-store" })
      if (!r.ok) throw new Error("The league feed is unavailable. Please try again.")
      return r.json()
    }
    try {
      const [t, p] = await Promise.all([json("/api/tournaments"), json("/api/players")])
      const active = t.activeTournament
      let next = { ...empty, active, players: p.players || [] }
      if (active) {
        const q = `?tournamentId=${encodeURIComponent(active.id)}`
        const [s, f, leaders] = await Promise.all([
          json("/api/standings" + q),
          json("/api/fixtures" + q),
          json("/api/player-stats" + q),
        ])
        next = {
          ...next,
          standings: s.standings || [],
          fixtures: f.fixtures || [],
          topScorers: leaders.topScorers || [],
          topAssists: leaders.topAssists || [],
          discipline: leaders.discipline || [],
        }
      }
      if (!signal?.aborted) {
        setData(next)
        setError("")
      }
    } catch (e) {
      if (!signal?.aborted) setError(e instanceof Error ? e.message : "Unable to load the league.")
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    const refresh = () => {
      if (!document.hidden) load(controller.signal)
    }
    const timer = setInterval(refresh, 30000)
    window.addEventListener("focus", refresh)
    return () => {
      controller.abort()
      clearInterval(timer)
      window.removeEventListener("focus", refresh)
    }
  }, [load])
  return {
    data,
    loading,
    error,
    retry: () => {
      setLoading(true)
      load()
    },
  }
}
