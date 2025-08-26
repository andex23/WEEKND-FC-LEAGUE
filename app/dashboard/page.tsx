"use client"

import { useEffect, useState } from "react"
import UserCard from "./_components/UserCard"
import UsefulLinks from "./_components/UsefulLinks"
import NextMatchCard from "./_components/NextMatchCard"
import RecentMatchCard from "./_components/RecentMatchCard"
import KpiCard from "./_components/KpiCard"
import FixtureList from "./_components/FixtureList"
import PersonalStats from "./_components/PersonalStats"
import LeagueTable from "./_components/LeagueTable"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        // Minimal mocked load; replace with Supabase queries if available
        const profile = await fetch("/api/player/profile").then((r) => r.json()).catch(() => ({ player: { name: "Player One", preferredClub: "Arsenal", console: "PS5", season_name: "2024/25" } }))
        const stats = await fetch("/api/player-stats").then((r) => r.json()).catch(() => ({ goals: 5, assists: 3, yellow: 1, red: 0, wins: 4, draws: 1, losses: 2 }))
        const fixtures = await fetch("/api/fixtures").then((r) => r.json()).catch(() => ({ fixtures: [] }))
        const standingsRes = await fetch("/api/standings").then((r) => r.json()).catch(() => ({ standings: [] }))
        const all = fixtures.fixtures || []
        const next = all.find((f: any) => String(f.status || "").toUpperCase() !== "PLAYED") || null
        const recent = all.filter((f: any) => String(f.status || "").toUpperCase() === "PLAYED").slice(-1)[0] || null
        setData({ user: profile.player, stats, fixtures: all, next, recent, standings: standingsRes.standings || [] })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">Loading…</div>
  if (!data) return <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">No data</div>

  const user = data.user || {}
  const next = data.next && { opponent_name: data.next.awayPlayer || data.next.homePlayer, matchday: data.next.matchday, match_date: data.next.scheduledDate || data.next.kickoff_at, status: data.next.status, home_away: data.next.homePlayer === user.name ? "Home" : "Away" }
  const recent = data.recent && { opponent_name: data.recent.awayPlayer || data.recent.homePlayer, matchday: data.recent.matchday, home_score: data.recent.homeScore ?? 0, away_score: data.recent.awayScore ?? 0, result: (data.recent.homeScore ?? 0) === (data.recent.awayScore ?? 0) ? "D" : ((data.recent.homePlayer === user.name ? data.recent.homeScore : data.recent.awayScore) > (data.recent.homePlayer === user.name ? data.recent.awayScore : data.recent.homeScore) ? "W" : "L") }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad space-y-6">
        <header>
          <h1 className="text-xl font-extrabold">Dashboard</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-6 order-1">
            <UserCard user={user} />
            <div className="block lg:hidden">
              <div className="grid grid-cols-2 gap-3 mt-6">
                <KpiCard label="Position" value={user.position || "-"} />
                <KpiCard label="Points" value={user.points || "-"} />
              </div>
            </div>
            <div className="hidden lg:block">
              <UsefulLinks rulesUrl={user.rules_url} discordInvite={user.discord_invite_url} reportHref="/dashboard?report=1" />
            </div>
          </div>

          {/* Center column */}
          <div className="lg:col-span-6 space-y-6 order-3 lg:order-2">
            <NextMatchCard match={next} />
            <RecentMatchCard match={recent} />
            <LeagueTable standings={data.standings} />
            <div className="block lg:hidden">
              <UsefulLinks rulesUrl={user.rules_url} discordInvite={user.discord_invite_url} reportHref="/dashboard?report=1" />
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-3">
            <div className="hidden lg:grid grid-cols-2 gap-3">
              <KpiCard label="Position" value={user.position || "-"} />
              <KpiCard label="Points" value={user.points || "-"} />
            </div>
            <FixtureList fixtures={data.fixtures} />
            <PersonalStats stats={data.stats} />
          </div>
        </div>

        {/* Mobile order footer */}
        <div className="lg:hidden">
          <PersonalStats stats={data.stats} />
        </div>
      </div>
    </div>
  )
}
