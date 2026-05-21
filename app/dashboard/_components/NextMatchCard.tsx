"use client"

import { CalendarClock, Swords } from "lucide-react"
import { formatDateTime } from "@/lib/formatters"

export default function NextMatchCard({ match }: { match: any }) {
  return (
    <section aria-label="Next match" className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
      <div className="flex items-center gap-2">
        <Swords className="h-4 w-4 text-emerald-400" />
        <h3 className="font-heading text-sm text-white">Next Match</h3>
      </div>
      {match ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A7A7A]">Opponent</div>
            <div className="truncate font-heading text-lg text-white">{match.opponent_name}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-[#1A1A1A] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">
                MD {match.matchday}
              </span>
              {match.home_away && (
                <span className="rounded bg-[#1A1A1A] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">
                  {match.home_away}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block rounded-md bg-amber-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              {match.status || "Scheduled"}
            </span>
            <div className="mt-1.5 flex items-center justify-end gap-1 text-xs text-[#9E9E9E]">
              <CalendarClock className="h-3 w-3" />
              <time dateTime={match.match_date}>{formatDateTime(match.match_date)}</time>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-[#262626] py-6 text-center text-sm text-[#7A7A7A]">
          No upcoming fixtures.
        </div>
      )}
    </section>
  )
}
