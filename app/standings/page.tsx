"use client"
import Link from "next/link"
import { useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { useLeague } from "@/components/league/use-league"
import {
  PageHeading,
  SectionHeading,
  FeedState,
  PreSeason,
  Table,
  Crest,
} from "@/components/league/ui"
export default function StandingsPage() {
  const { data, loading, error, retry } = useLeague()
  const [consoleFilter, setConsoleFilter] = useState("all")
  const rows = data.standings.filter(
    (r) =>
      consoleFilter === "all" ||
      data.players.find((p) => p.id === r.playerId)?.console === consoleFilter,
  )
  const consoles = Array.from(new Set(data.players.map((p) => p.console).filter(Boolean)))
  return (
    <div className="fc-site">
      <div className="fc-wrap">
        <PageHeading
          eyebrow={data.active?.name || "The league / standings"}
          title="League table"
          description="Every match. Every point. The season so far."
        >
          <Link href="/fixtures" className="fc-text-link">
            Go to matchdays
            <ArrowUpRight size={17} />
          </Link>
        </PageHeading>
        <FeedState loading={loading} error={error} retry={retry} />
        {!loading && !error && (
          <>
            {!data.active ? (
              <PreSeason />
            ) : (
              <>
                <div className="fc-table-toolbar">
                  <span className="fc-eyebrow">
                    <span className="fc-dot" />
                    {data.active.season || "Current season"} · {rows.length} players
                  </span>
                  <label>
                    Platform
                    <select
                      value={consoleFilter}
                      onChange={(e) => setConsoleFilter(e.target.value)}
                    >
                      <option value="all">All platforms</option>
                      {consoles.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <Table rows={rows} players={data.players} fixtures={data.fixtures} />
                <div className="fc-table-key">
                  <span>Ranked by points → goal difference → goals scored</span>
                  <span>
                    <b>W</b> Win · <b>D</b> Draw · <b>L</b> Loss
                  </span>
                </div>
              </>
            )}
            {data.active && (
              <section className="fc-leader-section">
                <SectionHeading number="02" title="Player statistics" />
                <div className="fc-leader-grid">
                  {[
                    {
                      name: "Top scorers",
                      label: "Goals",
                      items: data.topScorers,
                      value: (r: any) => r.goals || 0,
                      empty: "The first goal is still to come.",
                    },
                    {
                      name: "Top assists",
                      label: "Assists",
                      items: data.topAssists,
                      value: (r: any) => r.assists || 0,
                      empty: "The next great pass starts here.",
                    },
                    {
                      name: "Discipline",
                      label: "YC / RC",
                      items: data.discipline,
                      value: (r: any) => `${r.yellow_cards || 0} / ${r.red_cards || 0}`,
                      empty: "A clean sheet for fair play.",
                    },
                  ].map((group, i) => (
                    <article key={group.name}>
                      <header>
                        <span className="fc-eyebrow">{group.label}</span>
                        <h3>{group.name}</h3>
                      </header>
                      {group.items.length ? (
                        group.items.slice(0, 5).map((r, j) => (
                          <div className="fc-leader-row" key={r.id || j}>
                            <span>{String(j + 1).padStart(2, "0")}</span>
                            <Crest team={r.team} />
                            <div>
                              <strong>{r.name}</strong>
                              <small>{r.team}</small>
                            </div>
                            <b>{group.value(r)}</b>
                          </div>
                        ))
                      ) : (
                        <p className="fc-empty">{group.empty}</p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
            {!data.active && data.players.length > 0 && (
              <section className="fc-roster">
                <SectionHeading number="03" title="The players" />
                <div>
                  {data.players.map((p) => (
                    <Link href={`/players/${p.id}`} key={p.id}>
                      <Crest team={p.preferred_club} />
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {p.preferred_club} · {p.console}
                        </small>
                      </span>
                      <ArrowUpRight size={18} />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
