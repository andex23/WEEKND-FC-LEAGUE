"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import UserCard from "./_components/UserCard"
import UsefulLinks from "./_components/UsefulLinks"
import NextMatchCard from "./_components/NextMatchCard"
import RecentMatchCard from "./_components/RecentMatchCard"
import KpiCard from "./_components/KpiCard"
import FixtureList from "./_components/FixtureList"
import PersonalStats from "./_components/PersonalStats"
import LeagueTable from "./_components/LeagueTable"
import { Skeleton } from "@/components/ui/skeleton"

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
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-6 text-center">
      {children}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad space-y-6">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-6 space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
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

    ;(async () => {
      try {
        const profileRes = await fetch("/api/player/profile")
        if (profileRes.status === 401) {
          window.location.href = "/auth/login?next=/dashboard"
          return
        }
        if (!profileRes.ok) throw new Error("We couldn't load your profile. Please try again.")
        const { player } = await profileRes.json()

        const [stats, fixturesData, standingsData] = await Promise.all([
          fetch("/api/player-stats").then((r) => (r.ok ? r.json() : {})),
          fetch("/api/player/fixtures").then((r) => (r.ok ? r.json() : { fixtures: [] })),
          fetch("/api/standings").then((r) => (r.ok ? r.json() : { standings: [] })),
        ])

        const all: PlayerFixture[] = fixturesData.fixtures || []
        const upcoming = all.filter((f) => String(f.status).toUpperCase() !== "PLAYED")
        const played = all.filter((f) => String(f.status).toUpperCase() === "PLAYED")

        if (!cancelled) {
          setData({
            user: player,
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
    })()

    return () => {
      cancelled = true
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
            className="rounded-md bg-[#00C853] px-4 py-2 text-sm font-semibold text-black"
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
        home_score: f.isHome ? f.homeScore ?? 0 : f.awayScore ?? 0,
        away_score: f.isHome ? f.awayScore ?? 0 : f.homeScore ?? 0,
        result,
      }
    })()

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad space-y-6">
        <header>
          <h1 className="text-xl font-extrabold">Dashboard</h1>
        </header>

        {user.status === "pending" && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            Your registration is awaiting admin approval. You'll appear in fixtures and
            standings once an admin approves your account.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6 order-1">
            <UserCard user={user} />
            <div className="block lg:hidden">
              <div className="grid grid-cols-2 gap-3 mt-6">
                <KpiCard label="Position" value={(user.position as string) || "-"} />
                <KpiCard label="Points" value={(user.points as number) ?? "-"} />
              </div>
            </div>
            <div className="hidden lg:block">
              <UsefulLinks reportHref="/report" />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6 order-3 lg:order-2">
            <NextMatchCard match={next} />
            <RecentMatchCard match={recent} />
            <LeagueTable standings={data.standings as never} />
            <div className="block lg:hidden">
              <UsefulLinks reportHref="/report" />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6 order-2 lg:order-3">
            <div className="hidden lg:grid grid-cols-2 gap-3">
              <KpiCard label="Position" value={(user.position as string) || "-"} />
              <KpiCard label="Points" value={(user.points as number) ?? "-"} />
            </div>
            <FixtureList fixtures={data.fixtures} />
            <PersonalStats stats={data.stats} />
          </div>
        </div>

        <div className="lg:hidden">
          <PersonalStats stats={data.stats} />
        </div>

        <div className="text-center">
          <Link href="/report" className="text-sm font-semibold text-[#00C853]">
            Report a result →
          </Link>
        </div>
      </div>
    </div>
  )
}
