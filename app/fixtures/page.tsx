"use client"
import { useState } from "react"
import { useLeague, isFinal } from "@/components/league/use-league"
import { PageHeading, FeedState, PreSeason, MatchRow } from "@/components/league/ui"
export default function FixturesPage() {
  const { data, loading, error, retry } = useLeague()
  const [tab, setTab] = useState("upcoming")
  const [day, setDay] = useState("all")
  const upcoming = data.fixtures.filter((f) => !isFinal(f) && f.status !== "CANCELLED"),
    results = data.fixtures.filter(isFinal),
    cancelled = data.fixtures.filter((f) => f.status === "CANCELLED")
  const pool = tab === "upcoming" ? upcoming : tab === "results" ? results : cancelled
  const days = Array.from(new Set(pool.map((f) => f.matchday))).sort((a, b) => a - b)
  const visible = day === "all" ? days : days.filter((d) => String(d) === day)
  return (
    <div className="fc-site">
      <div className="fc-wrap">
        <PageHeading
          eyebrow={data.active?.name || "The league / match centre"}
          title="Matchdays"
          description="Upcoming fixtures and confirmed results."
        />
        <FeedState loading={loading} error={error} retry={retry} />
        {!loading &&
          !error &&
          (!data.active ? (
            <PreSeason />
          ) : (
            <>
              <div className="fc-table-toolbar">
                <div className="fc-tabs" aria-label="Fixture status">
                  {[
                    ["upcoming", "Upcoming", upcoming.length],
                    ["results", "Results", results.length],
                    ...(cancelled.length ? [["cancelled", "Cancelled", cancelled.length]] : []),
                  ].map(([value, label, count]) => (
                    <button
                      key={value}
                      aria-pressed={tab === value}
                      onClick={() => {
                        setTab(String(value))
                        setDay("all")
                      }}
                    >
                      {label}
                      <span>{count}</span>
                    </button>
                  ))}
                </div>
                <label>
                  Matchday
                  <select value={day} onChange={(e) => setDay(e.target.value)}>
                    <option value="all">All matchdays</option>
                    {days.map((d) => (
                      <option key={d} value={d}>
                        Matchday {d}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {visible.length ? (
                visible.map((d) => (
                  <section key={d} className="fc-matchday">
                    <header>
                      <h2>
                        <span>MD</span>
                        {String(d).padStart(2, "0")}
                      </h2>
                      <span className="fc-eyebrow">
                        {pool.filter((f) => f.matchday === d).length} fixtures
                      </span>
                    </header>
                    <div>
                      {pool
                        .filter((f) => f.matchday === d)
                        .map((f) => (
                          <MatchRow key={f.id} fixture={f} players={data.players} />
                        ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="fc-season-note">
                  <span className="fc-outline-number" aria-hidden="true">
                    —
                  </span>
                  <div>
                    <h2>
                      {tab === "results"
                        ? "The final whistle is still to come."
                        : "No fixtures scheduled yet."}
                    </h2>
                    <p>
                      {tab === "results"
                        ? "Approved results will appear here after matches are played."
                        : "Check back when the next matchday is announced."}
                    </p>
                  </div>
                </div>
              )}
              <p className="fc-footnote">
                Expand a fixture for details. Kick-off times are shown in your local timezone.
              </p>
            </>
          ))}
      </div>
    </div>
  )
}
