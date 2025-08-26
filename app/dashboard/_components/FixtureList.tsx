"use client"

import { formatDateTime } from "@/lib/formatters"
import { useState } from "react"

export default function FixtureList({ fixtures = [] }: { fixtures: any[] }) {
  const [tab, setTab] = useState<"UPCOMING" | "COMPLETED">("UPCOMING")
  const filtered = fixtures.filter((f) => (tab === "UPCOMING" ? f.status !== "PLAYED" : f.status === "PLAYED")).slice(0, 6)
  return (
    <section aria-label="Fixtures" className="rounded-2xl p-4 border bg-[#0D0D0D] text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Fixtures</h3>
        <div className="text-xs text-[#9E9E9E]">
          <button className={`px-2 py-0.5 rounded ${tab === "UPCOMING" ? "bg-[#00C853] text-black" : ""}`} onClick={() => setTab("UPCOMING")}>Upcoming</button>
          <button className={`px-2 py-0.5 rounded ml-1 ${tab === "COMPLETED" ? "bg-[#00C853] text-black" : ""}`} onClick={() => setTab("COMPLETED")}>Completed</button>
        </div>
      </div>
      <ul className="mt-2 space-y-2 text-sm">
        {filtered.map((f) => (
          <li key={f.id} className="flex items-center justify-between px-3 py-2 rounded border bg-[#141414]">
            <div>
              <div className="font-semibold">{f.opponent_name}</div>
              <time className="text-xs text-[#9E9E9E]" dateTime={f.match_date}>{formatDateTime(f.match_date)}</time>
            </div>
            <div className="text-xs text-[#9E9E9E]">MD {f.matchday}</div>
          </li>
        ))}
        {filtered.length === 0 && <li className="text-[#9E9E9E]">No upcoming fixtures.</li>}
      </ul>
    </section>
  )
}
