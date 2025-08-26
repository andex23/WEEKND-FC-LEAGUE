"use client"

import { resultPill } from "@/lib/formatters"

export default function RecentMatchCard({ match }: { match: any }) {
  const pill = resultPill(match?.result)
  return (
    <section aria-label="Recent match" className="rounded-2xl p-4 border bg-[#0D0D0D] text-white">
      <h3 className="text-sm font-semibold">Most Recent</h3>
      {match ? (
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">{match.opponent_name}</div>
            <div className="text-xs text-[#9E9E9E]">Matchday {match.matchday}</div>
          </div>
          <div className="text-lg font-semibold tabular-nums">{match.home_score}–{match.away_score}</div>
          <div className={`px-2 py-0.5 text-xs rounded border ${pill.className}`}>{pill.text}</div>
        </div>
      ) : (
        <div className="mt-2 text-[#9E9E9E]">No recent match.</div>
      )}
    </section>
  )
}
