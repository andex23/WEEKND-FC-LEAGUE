import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  getPlayerByUserId,
  getPlayerStanding,
  getPlayerStats,
  getPlayerFixtures,
  getPlayerRecentResults,
  getPlayerByUsername,
} from "@/lib/supabase/queries"
import { MyStandingCard } from "@/components/dashboard/my-standing-card"
import { NextFixturesCard } from "@/components/dashboard/next-fixtures-card"
import { MyStatsCard } from "@/components/dashboard/my-stats-card"
import { RecentResultsCard } from "@/components/dashboard/recent-results-card"
import { AvailabilityToggle } from "@/components/dashboard/availability-toggle"

export default async function PlayerDashboard() {
  const supabase = createServerClient()

  const isDemoMode = process.env.NODE_ENV === "development"
  let player = null
  let user = null

  if (isDemoMode) {
    // Use demo player for preview
    player = await getPlayerByUsername("striker_sam")
    if (player) {
      user = { id: player.user_id }
    }
  }

  if (!player) {
    if (!supabase) {
      redirect("/auth/login")
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      redirect("/auth/login")
    }

    user = authUser
    player = await getPlayerByUserId(user.id)
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">You're not registered yet</h1>
            <p className="text-gray-600 max-w-md mx-auto">
              Join the Weeknd FC League to compete with other players and climb the table.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              Register Now
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Fetch all dashboard data
  const [standing, stats, nextFixtures, recentResults] = await Promise.all([
    getPlayerStanding(player.id),
    getPlayerStats(player.id),
    getPlayerFixtures(player.id, 3),
    getPlayerRecentResults(player.id, 5),
  ])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            {isDemoMode && <p className="text-sm text-purple-600 mt-2">Demo Mode - Viewing as {player.username}</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <MyStandingCard standing={standing} />
              <NextFixturesCard fixtures={nextFixtures} playerId={player.id} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <MyStatsCard stats={stats} />
              <RecentResultsCard results={recentResults} />
              <AvailabilityToggle playerId={player.id} initialAvailability={player.available_this_weekend ?? true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
