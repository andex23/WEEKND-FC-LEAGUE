"use client"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { formatDateTime } from "@/lib/formatters"
import { Pitch } from "@/components/league/ui"
export default function NextMatchCard({ match }: { match: any }) {
  return (
    <section aria-label="Next match" className="fc-next-match">
      <div className="fc-eyebrow">{match ? "Next match" : "Your next fixture"}</div>
      <h2>{match ? <>You vs {match.opponent_name}</> : <>Ready for the next season.</>}</h2>
      {match ? (
        <>
          <p>
            Matchday {match.matchday} · {match.home_away} ·{" "}
            {match.status === "PENDING"
              ? "Awaiting result confirmation"
              : match.status || "Scheduled"}
          </p>
          <p>
            <time dateTime={match.match_date || undefined}>{formatDateTime(match.match_date)}</time>
          </p>
          <Link href="/report" className="fc-button">
            {match.status === "PENDING" ? "View match report" : "Report your result"}
            <ArrowUpRight size={16} />
          </Link>
        </>
      ) : (
        <>
          <p>
            Your next fixture appears here once the league is scheduled.
            <br />
            Check your invitations below to claim your place.
          </p>
          <Link href="/rules" className="fc-text-link" style={{ marginTop: 20 }}>
            Get matchday ready
            <ArrowUpRight size={16} />
          </Link>
        </>
      )}
    </section>
  )
}
