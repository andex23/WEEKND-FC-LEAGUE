"use client"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

type NextMatch = {
  opponent_name: string
  matchday: number
  home_away: string
  match_date: string | null
  status: string
}
export default function NextMatchCard({ match }: { match: NextMatch | null }) {
  if (!match) return null
  const pending = match.status.toUpperCase() === "PENDING"
  const scheduled = match.status.toUpperCase() === "SCHEDULED"
  const hasDate = Boolean(match.match_date && !Number.isNaN(Date.parse(match.match_date)))
  return (
    <section aria-label="Next match" className="fc-next-match">
      <div className="fc-eyebrow">{pending ? "Result in review" : "Next match"}</div>
      <h2>You vs {match.opponent_name}</h2>
      <p>
        Matchday {match.matchday} · {match.home_away} ·{" "}
        {pending ? "Awaiting result confirmation" : "Scheduled"}
      </p>
      <p>
        {hasDate ? (
          <time dateTime={match.match_date!}>
            {new Date(match.match_date!).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            (your local time)
          </time>
        ) : (
          "Kick-off to be confirmed"
        )}
      </p>
      {!hasDate && !pending && <p>Check the organizer’s updates for scheduling details.</p>}
      {scheduled && (
        <Link href="/report" className="fc-button">
          Report your result
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}
