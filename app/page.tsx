"use client"
import Link from "next/link"
import { useLeague, isFinal } from "@/components/league/use-league"
import { FeedState, Table, MatchRow } from "@/components/league/ui"
import { HomeHero } from "@/components/league/home-hero"
import { HomePlaybook } from "@/components/league/home-playbook"
export default function HomePage() {
  const { data, loading, error, retry } = useLeague()
  const next = data.fixtures.find((f) => !isFinal(f) && f.status !== "CANCELLED")
  const latest = data.fixtures
    .filter(isFinal)
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 2)
  return (
    <div className="fc-site">
      <HomeHero />
      <div className="fc-wrap club-season">
        <FeedState loading={loading} error={error} retry={retry} />
        {!loading &&
          !error &&
          (data.active ? (
            <>
              <div className="club-section-title">
                <h2>{data.active.name}</h2>
                <p>The latest from the league.</p>
              </div>
              <div className="club-live-grid">
                <section>
                  <div className="club-section-bar">
                    <h3>Matchday</h3>
                    <Link href="/fixtures">All fixtures</Link>
                  </div>
                  {next ? (
                    <MatchRow fixture={next} players={data.players} />
                  ) : (
                    <p className="fc-empty">The next fixture hasn’t been scheduled yet.</p>
                  )}
                  {latest.map((f) => (
                    <MatchRow key={f.id} fixture={f} players={data.players} />
                  ))}
                </section>
                <section>
                  <div className="club-section-bar">
                    <h3>Standings</h3>
                    <Link href="/standings">Full table</Link>
                  </div>
                  <Table rows={data.standings.slice(0, 5)} players={data.players} compact />
                </section>
              </div>
            </>
          ) : (
            <div className="club-season-wait">
              <img src="/logo.png" alt="" width={62} height={62} />
              <div>
                <h2>A new season is taking shape.</h2>
                <p>
                  Register now. Your tournament invitation will appear in your dashboard when the
                  next league is ready.
                </p>
              </div>
              <Link href="/rules" className="club-secondary">
                How the league works
              </Link>
            </div>
          ))}
      </div>
      <HomePlaybook />
    </div>
  )
}
