"use client"

import { History } from "lucide-react"
import { cn } from "@/lib/utils"

const RESULT: Record<string, { label: string; cls: string }> = {
  W: { label: "Win", cls: "bg-emerald-500/15 text-emerald-300" },
  D: { label: "Draw", cls: "bg-amber-500/15 text-amber-300" },
  L: { label: "Loss", cls: "bg-rose-500/15 text-rose-300" },
}

export default function RecentMatchCard({ match }: { match: any }) {
  const meta = RESULT[match?.result] ?? RESULT.D

  return (
    <section aria-label="Recent match" className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-emerald-400" />
        <h3 className="font-heading text-sm text-white">Most Recent</h3>
      </div>
      {match ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A7A7A]">Opponent</div>
            <div className="truncate font-heading text-lg text-white">{match.opponent_name}</div>
            <div className="mt-1 text-xs text-[#9E9E9E]">Matchday {match.matchday}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-heading text-2xl tabular-nums text-white">
              {match.home_score}
              <span className="text-[#4A4A4A]">–</span>
              {match.away_score}
            </div>
            <span className={cn("rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider", meta.cls)}>
              {meta.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-[#262626] py-6 text-center text-sm text-[#7A7A7A]">
          No matches played yet.
        </div>
      )}
    </section>
  )
}
