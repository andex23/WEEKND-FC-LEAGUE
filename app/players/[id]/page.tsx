"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useLeague } from "@/components/league/use-league"
import {
  PageHeading,
  FeedState,
  Crest,
  MatchRow,
  SectionHeading,
  Pitch,
} from "@/components/league/ui"
export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>()
  const { data, loading, error, retry } = useLeague()
  const player = data.players.find((p) => p.id === id)
  const row = data.standings.find((r) => r.playerId === id)
  const fixtures = data.fixtures.filter((f) => f.homePlayer === id || f.awayPlayer === id)
  return (
    <div className="fc-site">
      <div className="fc-wrap">
        <Link href="/standings" className="fc-back">
          <ArrowLeft size={15} />
          Back to standings
        </Link>
        <FeedState loading={loading} error={error} retry={retry} />
        {!loading &&
          !error &&
          (player ? (
            <>
              <div className="fc-profile-header">
                <div>
                  <PageHeading
                    eyebrow={`Player profile / ${player.console}`}
                    title={player.name}
                    description={row?.team || player.assigned_club || player.preferred_club}
                  />
                  <div className="fc-eyebrow">
                    {data.active?.name || "Ready for the next season"}
                  </div>
                </div>
                <div className="fc-profile-crest">
                  <Pitch />
                  {player.avatar_url ? (
                    <img src={player.avatar_url} alt={player.name} />
                  ) : (
                    <Crest team={row?.team || player.preferred_club} large />
                  )}
                </div>
              </div>
              <div className="fc-record">
                {[
                  ["Played", row?.played],
                  ["Wins", row?.won],
                  ["Draws", row?.drawn],
                  ["Losses", row?.lost],
                  ["Goals", row?.goalsFor],
                  ["Points", row?.points],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="fc-eyebrow">{label}</span>
                    <strong>{value ?? 0}</strong>
                  </div>
                ))}
              </div>
              <SectionHeading number="02" title="On the record" />
              {fixtures.length ? (
                fixtures.map((f) => <MatchRow key={f.id} fixture={f} players={data.players} />)
              ) : (
                <p className="fc-empty">
                  No fixtures in the current season. The story starts at kick-off.
                </p>
              )}
            </>
          ) : (
            <div className="fc-empty">
              <h1>Player not found</h1>
              <p>This player isn’t on the approved roster.</p>
              <Link href="/standings" className="fc-text-link">
                View the league
              </Link>
            </div>
          ))}
      </div>
    </div>
  )
}
