"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export default function FixtureList({ fixtures = [] as any[] }) {
  const [tab, setTab] = useState<"UPCOMING" | "COMPLETED">("UPCOMING")
  const filtered = fixtures
    .filter((f) =>
      tab === "UPCOMING"
        ? String(f.status || "").toUpperCase() !== "PLAYED"
        : String(f.status || "").toUpperCase() === "PLAYED",
    )
    .slice(0, 6)

  return (
    <section aria-label="Fixture list" className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm text-white">My Fixtures</h3>
        <span className="text-xs text-[#7A7A7A]">{filtered.length} shown</span>
      </div>
      <div className="mb-3 inline-flex rounded-lg border border-[#1E1E1E] bg-[#0D0D0D] p-1">
        {(["UPCOMING", "COMPLETED"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors",
              tab === t ? "bg-emerald-500 text-black" : "text-[#8A8A8A] hover:text-white",
            )}
          >
            {t === "UPCOMING" ? "Upcoming" : "Completed"}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#262626] py-6 text-center text-sm text-[#7A7A7A]">
          No fixtures.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((f: any) => (
            <li key={f.id} className="rounded-lg border border-[#1E1E1E] bg-[#0D0D0D] px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded bg-[#1A1A1A] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">
                    MD{f.matchday}
                  </span>
                  <span className="truncate text-sm text-[#D1D1D1]">
                    {f.homePlayer} <span className="text-[#5C5C5C]">vs</span> {f.awayPlayer}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-[#7A7A7A]">
                  {f.scheduledDate ? new Date(f.scheduledDate).toLocaleDateString() : "TBD"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
