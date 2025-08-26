"use client"

import { useState } from "react"

export default function FixtureList({ fixtures = [] as any[] }) {
  const [tab, setTab] = useState<"UPCOMING" | "COMPLETED">("UPCOMING")
  const filtered = fixtures.filter((f) => (tab === "UPCOMING" ? String(f.status || "").toUpperCase() !== "PLAYED" : String(f.status || "").toUpperCase() === "PLAYED")).slice(0, 6)
  return (
    <section aria-label="Fixture list" className="rounded-2xl bg-[#141414] border p-4 text-white">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold">Fixtures</h2>
        <div className="text-xs text-[#9E9E9E]">{filtered.length} shown</div>
      </div>
      <div className="mb-2">
        <button className={`px-2 py-0.5 rounded ${tab === "UPCOMING" ? "bg-emerald-500 text-black" : ""}`} onClick={() => setTab("UPCOMING")}>Upcoming</button>
        <button className={`px-2 py-0.5 rounded ml-1 ${tab === "COMPLETED" ? "bg-emerald-500 text-black" : ""}`} onClick={() => setTab("COMPLETED")}>Completed</button>
      </div>
      {filtered.length === 0 ? (
        <div className="text-sm text-[#9E9E9E]">No fixtures.</div>
      ) : (
        <ul className="space-y-2 text-sm">
          {filtered.map((f: any) => (
            <li key={f.id} className="border-t first:border-t-0 border-[#1E1E1E] pt-2">
              <div className="flex items-center justify-between">
                <div className="truncate mr-2">MD{f.matchday} • {f.homePlayer} vs {f.awayPlayer}</div>
                <div className="text-xs text-[#9E9E9E]">{f.scheduledDate ? new Date(f.scheduledDate).toLocaleString() : "TBD"}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
