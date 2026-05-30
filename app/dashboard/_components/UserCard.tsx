"use client"

import { PlayerCard } from "@/components/player-card"

export default function UserCard({ user, stats }: { user: any; stats?: any }) {
  const points = Number(user?.points ?? 0)
  const rating = Math.max(48, Math.min(99, Math.round(56 + points * 2)))
  const tier = rating >= 85 ? "Elite" : rating >= 70 ? "Pro" : "Rookie"

  const s = stats || {}
  const wins = Number(s.wins ?? 0)
  const draws = Number(s.draws ?? 0)
  const losses = Number(s.losses ?? 0)
  const statLine = [
    { label: "GP", value: wins + draws + losses },
    { label: "W", value: wins },
    { label: "D", value: draws },
    { label: "L", value: losses },
    { label: "GLS", value: Number(s.goals ?? 0) },
    { label: "AST", value: Number(s.assists ?? 0) },
  ]

  return (
    <section aria-label="Player card" className="flex justify-start">
      <PlayerCard
        name={user?.name}
        username={user?.username}
        gamertag={user?.psnName || user?.psn_id}
        club={user?.preferredClub || user?.preferred_club || user?.assignedTeam || user?.assigned_club}
        consoleType={user?.console}
        location={user?.location}
        rating={rating}
        tierLabel={tier}
        stats={statLine}
        avatarUrl={user?.avatar_url}
      />
    </section>
  )
}
