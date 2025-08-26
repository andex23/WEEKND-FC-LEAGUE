"use client"

import { formatDateTime } from "@/lib/formatters"

export default function NextMatchCard({ match }: { match: any }) {
  return (
    <section aria-label="Next match" className="rounded-2xl p-4 border bg-[#0D0D0D] text-white">
      <h3 className="text-sm font-semibold">Next Match</h3>
      {match ? (
        <div className="mt-2">
          <div className="text-base font-semibold">{match.opponent_name}</div>
          <div className="text-xs text-[#9E9E9E]">Matchday {match.matchday} · {match.home_away || ""}</div>
          <time className="text-xs text-[#9E9E9E]" dateTime={match.match_date}>{formatDateTime(match.match_date)}</time>
          <div className="mt-2 inline-flex items-center px-2 py-0.5 text-xs rounded border bg-amber-50 border-amber-200 text-amber-800">{match.status || "Scheduled"}</div>
        </div>
      ) : (
        <div className="mt-2 text-[#9E9E9E]">No upcoming fixtures.</div>
      )}
    </section>
  )
}
