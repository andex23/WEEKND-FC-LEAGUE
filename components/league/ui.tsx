"use client"
import Link from "next/link"
import { ArrowUpRight, ArrowRight, Shield, RotateCw } from "lucide-react"
import { useState } from "react"
import { getTeamBadge } from "@/lib/badges"
import type { LeagueFixture, LeaguePlayer, LeagueStanding } from "./use-league"
import { isFinal } from "./use-league"

export function Crest({ team, large = false }: { team?: string; large?: boolean }) {
  const [failed, setFailed] = useState(false)
  const url = getTeamBadge(team)
  return (
    <span className={`fc-crest ${large ? "fc-crest-lg" : ""}`}>
      {url && !failed ? (
        <img src={url} alt="" onError={() => setFailed(true)} />
      ) : (
        <Shield aria-hidden="true" />
      )}
    </span>
  )
}
export function Pitch({ className = "" }: { className?: string }) {
  return (
    <div className={`fc-pitch ${className}`} aria-hidden="true">
      <div className="fc-pitch-boundary">
        <i className="fc-halfway" />
        <i className="fc-centre" />
        <i className="fc-box fc-box-left" />
        <i className="fc-box fc-box-right" />
        <i className="fc-goal fc-goal-left" />
        <i className="fc-goal fc-goal-right" />
      </div>
    </div>
  )
}
export function PageHeading({
  eyebrow,
  title,
  accent,
  description,
  children,
}: {
  eyebrow: string
  title: string
  accent?: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <header className="fc-page-heading">
      <div>
        <h1>
          {title}
          {accent ? ` ${accent}` : ""}
        </h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </header>
  )
}
export function SectionHeading({
  number,
  title,
  href,
  label = "View all",
}: {
  number: string
  title: string
  href?: string
  label?: string
}) {
  return (
    <div className="fc-section-heading">
      <h2>{title}</h2>
      {href && (
        <Link href={href} className="fc-text-link">
          {label}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  )
}
export function FeedState({
  loading,
  error,
  retry,
}: {
  loading: boolean
  error: string
  retry: () => void
}) {
  if (error)
    return (
      <div className="fc-feed-state" role="alert">
        <p>{error}</p>
        <button onClick={retry} className="fc-text-link">
          <RotateCw size={15} />
          Try again
        </button>
      </div>
    )
  if (loading)
    return (
      <div className="fc-feed-state" role="status">
        <span className="fc-dot" />
        Loading the league…
      </div>
    )
  return null
}
export function PreSeason({ compact = false }: { compact?: boolean }) {
  return (
    <div className="fc-preseason">
      <img src="/logo.png" alt="" width={58} height={58} />
      <h2>The next season is on its way.</h2>
      <p>
        Standings and fixtures will appear when the tournament begins. Register your player to be
        ready for an invitation.
      </p>
      <Link className="fc-button" href="/register">
        Create your player
      </Link>
    </div>
  )
}
export function Table({
  rows,
  players,
  compact = false,
  fixtures = [],
}: {
  rows: LeagueStanding[]
  players: LeaguePlayer[]
  compact?: boolean
  fixtures?: LeagueFixture[]
}) {
  return (
    <div className="fc-table-scroll" tabIndex={0} role="region" aria-label="League standings table">
      <table className={`fc-table ${compact ? "is-compact" : ""}`}>
        <caption className="sr-only">
          League standings. Sorted by points, goal difference, then goals scored.
        </caption>
        <thead>
          <tr>
            <th scope="col">Pos</th>
            <th scope="col">Player / club</th>
            <th scope="col">P</th>
            {!compact && (
              <>
                <th scope="col">W</th>
                <th scope="col">D</th>
                <th scope="col">L</th>
                <th scope="col" className="fc-table-extra">
                  GF
                </th>
                <th scope="col" className="fc-table-extra">
                  GA
                </th>
              </>
            )}
            <th scope="col">GD</th>
            <th scope="col">Pts</th>
            {!compact && <th scope="col">Last 5</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const player = players.find((p) => p.id === r.playerId)
            const form = fixtures
              .filter(
                (f) => isFinal(f) && (f.homePlayer === r.playerId || f.awayPlayer === r.playerId),
              )
              .sort((a, b) => a.matchday - b.matchday)
              .slice(-5)
              .map((f) => {
                const home = f.homePlayer === r.playerId
                const mine = Number(home ? f.homeScore : f.awayScore)
                const theirs = Number(home ? f.awayScore : f.homeScore)
                return mine > theirs ? "W" : mine < theirs ? "L" : "D"
              })
            return (
              <tr key={r.playerId}>
                <td className="fc-position">{String(i + 1).padStart(2, "0")}</td>
                <td>
                  <div className="fc-player-cell">
                    <Crest team={r.team} />
                    <div>
                      {player ? (
                        <Link href={`/players/${r.playerId}`}>
                          {r.playerName}
                          <ArrowUpRight size={12} />
                        </Link>
                      ) : (
                        <strong>{r.playerName}</strong>
                      )}
                      <small>{r.team}</small>
                    </div>
                  </div>
                </td>
                <td>{r.played}</td>
                {!compact && (
                  <>
                    <td>{r.won}</td>
                    <td>{r.drawn}</td>
                    <td>{r.lost}</td>
                    <td className="fc-table-extra">{r.goalsFor}</td>
                    <td className="fc-table-extra">{r.goalsAgainst}</td>
                  </>
                )}
                <td>
                  {r.goalDifference > 0 ? "+" : ""}
                  {r.goalDifference}
                </td>
                <td className="fc-points">{r.points}</td>
                {!compact && (
                  <td>
                    <div className="fc-form">
                      {form.length ? (
                        form.map((f, j) => (
                          <span
                            key={j}
                            className={`form-${f}`}
                            title={f === "W" ? "Win" : f === "L" ? "Loss" : "Draw"}
                          >
                            {f}
                          </span>
                        ))
                      ) : (
                        <span aria-label="No matches played">—</span>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {!rows.length && (
        <p className="fc-empty">The table will take shape when the tournament roster is ready.</p>
      )}
    </div>
  )
}
export function MatchRow({
  fixture: f,
  players,
}: {
  fixture: LeagueFixture
  players: LeaguePlayer[]
}) {
  const home = players.find((p) => p.id === f.homePlayer),
    away = players.find((p) => p.id === f.awayPlayer)
  const final = isFinal(f),
    pending = f.status.toUpperCase() === "PENDING"
  const homeClub = f.homeTeam || home?.assigned_club || home?.preferred_club,
    awayClub = f.awayTeam || away?.assigned_club || away?.preferred_club
  const date = f.scheduledDate ? new Date(f.scheduledDate) : null
  return (
    <details className="fc-match">
      <summary>
        <div className="fc-match-meta">
          <span>
            {final
              ? "Full time"
              : pending
                ? "In review"
                : f.status === "CANCELLED"
                  ? "Cancelled"
                  : "Scheduled"}
          </span>
          <small>
            {date && !isNaN(date.getTime())
              ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
              : "Date TBC"}
          </small>
        </div>
        <div className="fc-match-team">
          <Crest team={homeClub} />
          <span>
            {home?.name || "Player"}
            <small>{homeClub || "Club TBC"}</small>
          </span>
        </div>
        <strong className={`fc-score ${final ? "is-final" : ""}`}>
          {final ? `${f.homeScore} – ${f.awayScore}` : "VS"}
        </strong>
        <div className="fc-match-team is-away">
          <span>
            {away?.name || "Player"}
            <small>{awayClub || "Club TBC"}</small>
          </span>
          <Crest team={awayClub} />
        </div>
        <ArrowUpRight className="fc-match-arrow" size={16} />
      </summary>
      <div className="fc-match-detail">
        <span>
          Matchday {f.matchday} ·{" "}
          {date && !isNaN(date.getTime())
            ? date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) +
              " (your local time)"
            : "Kick-off to be confirmed"}
        </span>
        <div>
          {home && (
            <Link href={`/players/${home.id}`}>
              {home.name}’s profile
              <ArrowRight size={13} />
            </Link>
          )}
          {away && (
            <Link href={`/players/${away.id}`}>
              {away.name}’s profile
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </details>
  )
}
