"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, AlertTriangle } from "lucide-react"
import UserCard from "./_components/UserCard"
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
      const result = mine == null || theirs == null ? "D" : mine > theirs ? "W" : mine < theirs ? "L" : "D"
      return {
        opponent_name: opponentOf(f),
        matchday: f.matchday,
        home_score: f.isHome ? f.homeScore ?? 0 : f.awayScore ?? 0,
        away_score: f.isHome ? f.awayScore ?? 0 : f.homeScore ?? 0,
        result,
      }
    })()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-[400px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
      </div>

      <div className="relative container-5xl section-pad space-y-6">
        <header>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> My Dashboard
          </span>
          <h1 className="mt-3 font-heading text-3xl text-white md:text-4xl">
            {user.name ? `Welcome back, ${user.name}` : "Dashboard"}
          </h1>
        </header>

        {user.status === "pending" && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Your registration is awaiting admin approval. You&apos;ll appear in fixtures and standings once an admin
              approves your account.
            </span>
          </div>
        )}

        <div className="grid items-start gap-4 md:grid-cols-[290px_minmax(0,1fr)]">
          <div className="space-y-3">
            <UserCard user={user} stats={data.stats} />
            {user.id ? (
              <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#9E9E9E]">
                  Profile picture
                </div>
                <AvatarUpload
                  userId={String(user.id)}
                  initialUrl={(user.avatar_url as string | null) ?? null}
                  onChange={(url) => setData((d) => (d ? { ...d, user: { ...d.user, avatar_url: url } } : d))}
                />
              </div>
            ) : null}
          </div>
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(180px,220px)_minmax(0,1fr)]">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
              <KpiCard label="Position" value={(user.position as string) || "-"} />
              <KpiCard label="Points" value={(user.points as number) ?? "-"} />
            </div>
            <TournamentInvites />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <NextMatchCard match={next} />
            <RecentMatchCard match={recent} />
            <LeagueTable standings={data.standings as never} />
          </div>

          <div className="space-y-6 lg:col-span-4">
            <FixtureList fixtures={data.fixtures} />
            <PersonalStats stats={data.stats} />
          </div>
        </div>

        <UsefulLinks reportHref="/report" />

        <div className="text-center">
          <Link
            href="/report"
            className="inline-flex h-11 items-center gap-2 rounded-lg px-6 font-heading text-sm text-black"
            style={{ background: "linear-gradient(90deg,#f5c54a,#10b981)" }}
          >
            Report a result <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
