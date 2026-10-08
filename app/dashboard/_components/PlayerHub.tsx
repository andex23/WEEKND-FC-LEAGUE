"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight, Check, Circle, CalendarDays, ShieldCheck } from "lucide-react"
import { AvatarUpload } from "@/components/avatar-upload"
import {
  buildPlayerHub,
  seasonDate,
  type HubPlayer,
  type HubTournament,
  type HubEntry,
  type HubFixture,
  type HubMessage,
} from "@/lib/dashboard/player-hub"
import type { Standing } from "@/lib/types"
import NextMatchCard from "./NextMatchCard"
import RecentMatchCard from "./RecentMatchCard"
import LeagueTable from "./LeagueTable"
import FixtureList from "./FixtureList"

export type PlayerHubProps = {
  player: HubPlayer
  entries: HubEntry[]
  activeTournament: HubTournament | null
  fixtures: HubFixture[]
  standings: Standing[]
  messages: HubMessage[]
  messagesError: string | null
  invitations?: ReactNode
  quickActions?: ReactNode
  onPhotoChange?: (url: string | null) => void
}

export default function PlayerHub(props: PlayerHubProps) {
  const { player, messages, messagesError } = props
  const hub = buildPlayerHub(props)
  const opponentOf = (fixture: HubFixture) =>
    fixture.isHome ? fixture.awayPlayer : fixture.homePlayer
  const next = hub.next && {
    opponent_name: opponentOf(hub.next),
    matchday: hub.next.matchday,
    home_away: hub.next.isHome ? "Home" : "Away",
    match_date: hub.next.scheduledDate,
    status: hub.next.status.toUpperCase(),
  }
  const recent = hub.recent && {
    opponent_name: opponentOf(hub.recent),
    matchday: hub.recent.matchday,
    home_score: hub.recent.isHome ? hub.recent.homeScore : hub.recent.awayScore,
    away_score: hub.recent.isHome ? hub.recent.awayScore : hub.recent.homeScore,
    result: hub.form[0],
  }

  return (
    <div className="fc-site fc-dashboard fc-player-hub">
      <div className="fc-wrap">
        <header className="fc-hub-heading">
          <div>
            <span className="fc-eyebrow">Weekend FC / Player hub</span>
            <h1>
              {player.status === "approved" && player.name
                ? `Hey, ${player.name}.`
                : "Your player hub"}
            </h1>
          </div>
          <p>Your place in the league. Your next move.</p>
        </header>

        <section
          className="fc-hub-status"
          aria-labelledby="hub-status-title"
          data-state={hub.status.kind}
        >
          <div className="fc-hub-status-copy">
            <span className="fc-hub-badge">
              <ShieldCheck size={14} aria-hidden="true" />
              {hub.status.label}
            </span>
            <h2 id="hub-status-title">{hub.status.title}</h2>
            <p>{hub.status.detail}</p>
          </div>
          <Link href={hub.status.href} className="fc-button">
            {hub.status.action}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>

        {player.status === "approved" && (
          <>
            {hub.visibleEntries.length > 0 && props.invitations}
            <div className="fc-hub-grid">
              <section id="player-card" className="fc-hub-card" aria-labelledby="player-card-title">
                <div className="fc-hub-section-heading">
                  <span className="fc-eyebrow">01 / Your player</span>
                  <span className="fc-hub-meta">{hub.profile.completed}/4 details added</span>
                </div>
                <h2 id="player-card-title">{player.name || "Your player card"}</h2>
                <dl className="fc-hub-player-details">
                  <div>
                    <dt>Gamertag</dt>
                    <dd>{hub.profile.gamertag || "Not added"}</dd>
                  </div>
                  <div>
                    <dt>Console</dt>
                    <dd>{hub.profile.console || "Not added"}</dd>
                  </div>
                  <div>
                    <dt>{hub.profile.clubLabel}</dt>
                    <dd>{hub.profile.club || "Choose with your invitation"}</dd>
                  </div>
                </dl>
                <div className="fc-hub-photo">
                  <AvatarUpload
                    key={`${player.id}:${player.avatar_url || "no-photo"}`}
                    userId={player.id}
                    initialUrl={player.avatar_url}
                    onChange={props.onPhotoChange}
                  />
                  <p>Your photo is visible on your public player profile.</p>
                </div>
                <div className="fc-hub-checklist">
                  <h3>Player checklist</h3>
                  <ul>
                    {hub.profile.checklist.map((item) => (
                      <li key={item.key} className={item.done ? "is-complete" : ""}>
                        {item.done ? (
                          <Check size={16} aria-hidden="true" />
                        ) : (
                          <Circle size={16} aria-hidden="true" />
                        )}
                        <span>
                          <strong>
                            {item.label}
                            <span className="sr-only">
                              {item.done ? ": complete" : ": not added"}
                            </span>
                          </strong>
                          {!item.done && <small>{item.hint}</small>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p>Need to change your gamertag or console? Contact an organizer.</p>
                </div>
              </section>

              <section
                id="season-overview"
                className="fc-hub-card"
                aria-labelledby="season-overview-title"
              >
                <div className="fc-hub-section-heading">
                  <span className="fc-eyebrow">02 / Season overview</span>
                  <CalendarDays size={18} aria-hidden="true" />
                </div>
                <h2 id="season-overview-title">{hub.tournament?.name || "The next season"}</h2>
                <p className="fc-hub-muted">
                  {hub.tournament?.season || "Season details will be confirmed by the organizer."}
                </p>
                <dl className="fc-hub-season-details">
                  <div>
                    <dt>Start date</dt>
                    <dd>{hub.startDate}</dd>
                  </div>
                  <div>
                    <dt>End date</dt>
                    <dd>{hub.endDate}</dd>
                  </div>
                  <div>
                    <dt>Tournament status</dt>
                    <dd>
                      {hub.tournament
                        ? {
                            ACTIVE: "Active",
                            DRAFT: "Being prepared",
                            COMPLETE: "Completed",
                            COMPLETED: "Completed",
                            CANCELLED: "Cancelled",
                          }[hub.tournament.status.toUpperCase()] || "To be confirmed"
                        : "Awaiting announcement"}
                    </dd>
                  </div>
                </dl>
                <Link href="/rules" className="fc-text-link fc-hub-rules">
                  Read the league rules
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <div id="organizer-updates" className="fc-hub-updates">
                  <h3>Organizer updates</h3>
                  {messagesError ? (
                    <p role="status">{messagesError}</p>
                  ) : messages.length ? (
                    <ul>
                      {messages.slice(0, 3).map((message) => (
                        <li key={message.id}>
                          <time
                            dateTime={
                              Number.isNaN(Date.parse(message.created_at))
                                ? undefined
                                : message.created_at
                            }
                          >
                            {seasonDate(message.created_at)}
                          </time>
                          <h4>{message.title}</h4>
                          <p>{message.body}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      No updates yet. Announcements and messages from the organizer will appear
                      here.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {(hub.next || hub.recent || hub.fixtures.length > 0 || hub.showStandings) && (
              <section
                id="match-centre"
                className="fc-hub-match-centre"
                aria-labelledby="match-centre-title"
              >
                <div className="fc-hub-section-heading">
                  <div>
                    <span className="fc-eyebrow">03 / When it’s matchday</span>
                    <h2 id="match-centre-title">Match centre</h2>
                  </div>
                  {hub.form.length > 0 && (
                    <div className="fc-hub-form" aria-label="Recent form, newest first">
                      {hub.form.map((result, index) => (
                        <span
                          key={index}
                          data-result={result}
                          title={result === "W" ? "Win" : result === "D" ? "Draw" : "Loss"}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="fc-dashboard-layout">
                  <div className="fc-dashboard-main">
                    {next && <NextMatchCard match={next} />}
                    {recent && <RecentMatchCard match={recent} />}
                    {hub.showStandings && <LeagueTable standings={props.standings} />}
                  </div>
                  <div className="fc-dashboard-side">
                    {hub.position !== null && (
                      <div className="fc-hub-standing">
                        <span>
                          League position<strong>#{hub.position}</strong>
                        </span>
                        <span>
                          Points<strong>{hub.points}</strong>
                        </span>
                      </div>
                    )}
                    {hub.fixtures.length > 0 && <FixtureList fixtures={hub.fixtures} />}
                  </div>
                </div>
              </section>
            )}
            {props.quickActions && <div className="fc-hub-actions">{props.quickActions}</div>}
          </>
        )}
      </div>
    </div>
  )
}
