"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, AlertTriangle } from "lucide-react"
import { PageHeading } from "@/components/league/ui"
import UsefulLinks from "./_components/UsefulLinks"
import NextMatchCard from "./_components/NextMatchCard"
import RecentMatchCard from "./_components/RecentMatchCard"
import KpiCard from "./_components/KpiCard"
import FixtureList from "./_components/FixtureList"
import PersonalStats from "./_components/PersonalStats"
import LeagueTable from "./_components/LeagueTable"
import TournamentInvites from "./_components/TournamentInvites"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarUpload } from "@/components/avatar-upload"

type PlayerFixture = {
  id: string
  matchday: number
  homePlayer: string
  awayPlayer: string
  homeScore: number | null
  awayScore: number | null
  status: string
  scheduledDate: string | null
  isHome: boolean
}

type DashboardData = {
  user: Record<string, unknown> & { name?: string; status?: string }
  stats: Record<string, number>
  fixtures: PlayerFixture[]
  next: PlayerFixture | null
  recent: PlayerFixture | null
  standings: unknown[]
  activeTournament: { id: string; name: string } | null
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6 text-center text-white">
      {children}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container-5xl section-pad space-y-6">
        <Skeleton className="h-8 w-48 bg-[#161616]" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-3">
            <Skeleton className="h-[420px] w-full rounded-2xl bg-[#161616]" />
            <Skeleton className="h-40 w-full rounded-2xl bg-[#161616]" />
          </div>
          <div className="space-y-6 lg:col-span-6">
            <Skeleton className="h-32 w-full rounded-2xl bg-[#161616]" />
            <Skeleton className="h-32 w-full rounded-2xl bg-[#161616]" />
            <Skeleton className="h-64 w-full rounded-2xl bg-[#161616]" />
          </div>
          <div className="space-y-6 lg:col-span-3">
            <Skeleton className="h-44 w-full rounded-2xl bg-[#161616]" />
            <Skeleton className="h-44 w-full rounded-2xl bg-[#161616]" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const profileRes = await fetch("/api/player/profile", {
          signal: AbortSignal.timeout(15000),
        })
        if (profileRes.status === 401) {
          window.location.href = "/auth/login?next=/dashboard"
          return
        }
        if (!profileRes.ok) throw new Error("We couldn't load your profile. Please try again.")
        const { player } = await profileRes.json()

        const getJSON = async (url: string) => {
          const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
          if (!response.ok) throw new Error("We couldn't load your league data. Please try again.")
          return response.json()
        }
        const { activeTournament } = await getJSON("/api/tournaments")
        const qs = activeTournament
          ? `?tournamentId=${encodeURIComponent(activeTournament.id)}`
          : ""
        const [stats, fixturesData, standingsData] = activeTournament
          ? await Promise.all([
              getJSON(`/api/player-stats${qs}`),
              getJSON("/api/player/fixtures"),
              getJSON(`/api/standings${qs}`),
            ])
          : [{ goals: 0, assists: 0, yellow: 0, red: 0 }, { fixtures: [] }, { standings: [] }]

        const all: PlayerFixture[] = fixturesData.fixtures || []
        const upcoming = all.filter(
          (f) => !["PLAYED", "FORFEIT", "CANCELLED"].includes(String(f.status).toUpperCase()),
        )
        const played = all.filter((f) =>
          ["PLAYED", "FORFEIT"].includes(String(f.status).toUpperCase()),
        )
        const position = standingsData.standings.findIndex((row: any) => row.playerId === player.id)
        const myStanding = standingsData.standings[position]
        Object.assign(player, {
          position: position >= 0 ? position + 1 : null,
          points: myStanding?.points ?? 0,
        })
        Object.assign(stats, {
          wins: myStanding?.won ?? 0,
          draws: myStanding?.drawn ?? 0,
          losses: myStanding?.lost ?? 0,
        })

        if (!cancelled) {
          setError(null)
          setData({
            user: player,
            activeTournament,
            stats,
            fixtures: all,
            next: upcoming[0] || null,
            recent: played[played.length - 1] || null,
            standings: standingsData.standings || [],
          })
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const refresh = () => {
      if (!document.hidden) load()
    }
    const timer = window.setInterval(refresh, 30000)
    window.addEventListener("focus", refresh)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener("focus", refresh)
    }
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error) {
    return (
      <Centered>
        <div className="space-y-3">
          <p className="text-[#9E9E9E]">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
          >
            Retry
          </button>
        </div>
      </Centered>
    )
  }
  if (!data) return <Centered>No data available.</Centered>

  const { user } = data
  const opponentOf = (f: PlayerFixture) => (f.isHome ? f.awayPlayer : f.homePlayer)

  const next = data.next && {
    opponent_name: opponentOf(data.next),
    matchday: data.next.matchday,
    home_away: data.next.isHome ? "Home" : "Away",
    match_date: data.next.scheduledDate,
    status: data.next.status,
  }

  const recent =
    data.recent &&
    (() => {
      const f = data.recent
      const mine = f.isHome ? f.homeScore : f.awayScore
      const theirs = f.isHome ? f.awayScore : f.homeScore
      const result =
        mine == null || theirs == null ? "D" : mine > theirs ? "W" : mine < theirs ? "L" : "D"
      return {
        opponent_name: opponentOf(f),
        matchday: f.matchday,
        home_score: f.isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0),
        away_score: f.isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0),
        result,
      }
    })()

  return (
    <div className="fc-site fc-dashboard">
      <div className="fc-wrap">
        <PageHeading
          eyebrow={data.activeTournament?.name || "Player dashboard / the dressing room"}
          title={user.name ? `Welcome back, ${user.name}.` : "Your dashboard"}
          description="Your fixtures, your form, your next move."
        />
        <div className="fc-dashboard-layout">
          <div className="fc-dashboard-main">
            {user.status === "pending" && (
              <div className="fc-dashboard-notice">
                Your registration is awaiting approval. Once approved, you can accept a tournament
                invitation and choose your club.
              </div>
            )}
            <NextMatchCard match={next} />
            <TournamentInvites />
            {data.activeTournament && (
              <div className="fc-record">
                {[
                  ["Position", user.position || "—"],
                  ["Points", user.points ?? 0],
                  ["Wins", data.stats.wins ?? 0],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <span className="fc-eyebrow">{String(label)}</span>
                    <strong>{String(value)}</strong>
                  </div>
                ))}
              </div>
            )}
            {data.activeTournament && (
              <>
                <RecentMatchCard match={recent} />
                <LeagueTable standings={data.standings as never} />
                <FixtureList fixtures={data.fixtures} />
              </>
            )}
          </div>
          <aside className="fc-dashboard-side">
            <section className="fc-member">
              <span className="fc-eyebrow">Your player</span>
              <h2>{user.name}</h2>
              <p>
                {String(
                  user.preferred_club ||
                    user.assigned_club ||
                    "Club selection opens with your invitation",
                )}
              </p>
            </section>
            {user.id ? (
              <div>
                <div className="fc-eyebrow" style={{ marginBottom: 15 }}>
                  Your player photo
                </div>
                <AvatarUpload
                  userId={String(user.id)}
                  initialUrl={(user.avatar_url as string | null) ?? null}
                  onChange={(url) =>
                    setData((d) => (d ? { ...d, user: { ...d.user, avatar_url: url } } : d))
                  }
                />
              </div>
            ) : null}
            {data.activeTournament && <PersonalStats stats={data.stats} />}
            <UsefulLinks reportHref="/report" />
          </aside>
        </div>
      </div>
    </div>
  )
}
