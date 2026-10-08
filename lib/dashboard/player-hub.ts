export type HubPlayer = {
  id: string
  name?: string | null
  username?: string | null
  status?: string | null
  psn_id?: string | null
  console?: string | null
  preferredClub?: string | null
  available?: boolean | null
  avatar_url?: string | null
}

export type HubTournament = {
  id: string
  name: string
  status: string
  season?: string | null
  start_at?: string | null
  end_at?: string | null
}

export type HubEntry = {
  id: string
  tournament_id: string
  status: "invited" | "accepted" | "declined"
  selected_club: string | null
  tournament: HubTournament
}

export type HubFixture = {
  id: string
  matchday: number
  homePlayer: string
  awayPlayer: string
  homeScore: number | null
  awayScore: number | null
  status: string
  scheduledDate: string | null
  isHome: boolean
}

export type HubMessage = { id: string; title: string; body: string; created_at: string }

type HubStanding = { playerId: string; played: number; points: number }
type HubStatus = {
  kind: string
  label: string
  title: string
  detail: string
  action: string
  href: string
}
const text = (value?: string | null) => value?.trim() || null
const isComplete = (tournament: HubTournament) =>
  ["COMPLETE", "COMPLETED", "CANCELLED"].includes(tournament.status.toUpperCase())
const scoreIsValid = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 99

export function seasonDate(value?: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return "Date TBC"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value))
}

export function buildPlayerHub({
  player,
  entries,
  activeTournament,
  fixtures,
  standings,
}: {
  player: HubPlayer
  entries: HubEntry[]
  activeTournament: HubTournament | null
  fixtures: HubFixture[]
  standings: HubStanding[]
}) {
  const approved = player.status === "approved"
  const currentEntries = approved ? entries.filter((entry) => !isComplete(entry.tournament)) : []
  const playing = approved && activeTournament?.status.toUpperCase() === "ACTIVE"
  const availableFixtures = playing
    ? fixtures
        .filter((fixture) =>
          ["SCHEDULED", "PENDING", "PLAYED", "FORFEIT"].includes(fixture.status.toUpperCase()),
        )
        .sort((a, b) => a.matchday - b.matchday)
    : []
  const activeEntry = currentEntries.find((entry) => entry.tournament_id === activeTournament?.id)
  const pendingEntry =
    activeEntry?.status === "invited"
      ? activeEntry
      : currentEntries.find((entry) => entry.status === "invited")
  const acceptedEntry =
    activeEntry?.status === "accepted"
      ? activeEntry
      : currentEntries.find((entry) => entry.status === "accepted")
  // A single focus keeps the banner, dates and club in the same tournament.
  // Real current fixtures take precedence over invitations for another season.
  const focusEntry = availableFixtures.length
    ? activeEntry || null
    : pendingEntry ||
      acceptedEntry ||
      activeEntry ||
      currentEntries[0] ||
      (approved ? entries[0] : null)
  const tournament = availableFixtures.length
    ? activeTournament
    : focusEntry?.tournament || (approved ? activeTournament : null)
  const scheduled = availableFixtures.filter(
    (fixture) => fixture.status.toUpperCase() === "SCHEDULED",
  )
  const awaitingReview = availableFixtures.filter(
    (fixture) => fixture.status.toUpperCase() === "PENDING",
  )
  const played = availableFixtures
    .filter(
      (fixture) =>
        ["PLAYED", "FORFEIT"].includes(fixture.status.toUpperCase()) &&
        scoreIsValid(fixture.homeScore) &&
        scoreIsValid(fixture.awayScore),
    )
    .reverse()
  const next = scheduled[0] || awaitingReview[0] || null
  const recent = played[0] || null
  const form = played.slice(0, 5).map((fixture) => {
    const mine = (fixture.isHome ? fixture.homeScore : fixture.awayScore)!
    const theirs = (fixture.isHome ? fixture.awayScore : fixture.homeScore)!
    return mine > theirs ? ("W" as const) : mine < theirs ? ("L" as const) : ("D" as const)
  })
  const canReport = scheduled.length > 0
  const showStandings = Boolean(
    playing && tournament?.id === activeTournament?.id && standings.some((row) => row.played > 0),
  )
  const myIndex = showStandings ? standings.findIndex((row) => row.playerId === player.id) : -1
  const standing = myIndex >= 0 ? standings[myIndex] : null

  let status: HubStatus = {
    kind: "waiting",
    label: "Approved",
    title: "Waiting for a tournament invitation",
    detail:
      "Your registration is approved. An organizer will invite you when a tournament is ready. In the meantime, check your player details and the rules.",
    action: "Check your player card",
    href: "#player-card",
  }
  if (!approved) {
    status = {
      kind: player.status === "pending" ? "pending" : "unavailable",
      label: player.status === "pending" ? "Awaiting approval" : "Access unavailable",
      title:
        player.status === "pending"
          ? "Your registration is being reviewed"
          : "Check your account status",
      detail: "League access requires a verified email and an approved registration.",
      action: "Go to sign in",
      href: "/auth/login?next=/dashboard",
    }
  } else if (canReport) {
    status = {
      kind: "scheduled",
      label: "Match ready",
      title: "Your next match is ready",
      detail: "Check your opponent and kick-off details below. Submit your result after you play.",
      action: "Open match centre",
      href: "#match-centre",
    }
  } else if (awaitingReview.length) {
    status = {
      kind: "review",
      label: "Result in review",
      title: "Your result is awaiting confirmation",
      detail:
        "The organizer will confirm the submitted score. It will count towards your record once approved.",
      action: "View match status",
      href: "#match-centre",
    }
  } else if (played.length) {
    status = {
      kind: "caught-up",
      label: "Up to date",
      title: "You’re all caught up",
      detail:
        "Your completed results are below. Your next fixture will appear when it is scheduled.",
      action: "View match centre",
      href: "#match-centre",
    }
  } else if (focusEntry?.status === "invited" && !isComplete(focusEntry.tournament)) {
    status = {
      kind: "invited",
      label: "Invitation received",
      title: "Your place is waiting",
      detail: `Choose your club and respond to your invitation for ${focusEntry.tournament.name}.`,
      action: "Review invitation",
      href: "#tournament-invites",
    }
  } else if (focusEntry?.status === "accepted" && !isComplete(focusEntry.tournament)) {
    status = {
      kind: "accepted",
      label: "Tournament joined",
      title: "You’re in. Your fixtures are next.",
      detail:
        "Your entry is confirmed. Fixtures will appear here when the organizer publishes your schedule.",
      action: "View season overview",
      href: "#season-overview",
    }
  } else if (focusEntry && isComplete(focusEntry.tournament)) {
    status = {
      kind: "completed",
      label: "Tournament closed",
      title: "This tournament has finished",
      detail:
        "There are no open matches for this tournament. Watch for your next invitation and organizer updates.",
      action: "View season overview",
      href: "#season-overview",
    }
  } else if (focusEntry?.status === "declined") {
    status = {
      kind: "declined",
      label: "Invitation declined",
      title: "You haven’t joined this tournament",
      detail:
        "Contact an organizer if you want to take part. Any new invitations will appear here.",
      action: "View organizer updates",
      href: "#organizer-updates",
    }
  }

  const selectedClub = focusEntry?.status === "accepted" ? text(focusEntry.selected_club) : null
  const club = selectedClub || text(player.preferredClub)
  const gamertag = text(player.psn_id)
  const consoleName = text(player.console)
  const checklist = [
    {
      key: "gamertag",
      label: "Gamertag",
      done: Boolean(gamertag),
      hint: gamertag || "Ask an organizer to update your gamertag.",
    },
    {
      key: "console",
      label: "Console",
      done: Boolean(consoleName),
      hint: consoleName || "Ask an organizer to update your console.",
    },
    {
      key: "photo",
      label: "Player photo",
      done: Boolean(text(player.avatar_url)),
      hint: text(player.avatar_url)
        ? "Photo added"
        : "Add a photo so other players can recognize you (optional).",
    },
    {
      key: "club",
      label: selectedClub ? "Tournament club" : "Preferred club",
      done: Boolean(club),
      hint: club || "Choose your tournament club when you accept an invitation.",
    },
  ]

  return {
    status,
    tournament,
    startDate: seasonDate(tournament?.start_at),
    endDate: seasonDate(tournament?.end_at),
    profile: {
      gamertag,
      console: consoleName,
      club,
      clubLabel: selectedClub ? "Tournament club" : "Preferred club",
      checklist,
      completed: checklist.filter((row) => row.done).length,
    },
    next,
    recent,
    form,
    fixtures: availableFixtures,
    canReport,
    showStandings,
    position: myIndex >= 0 ? myIndex + 1 : null,
    points: standing?.points ?? null,
    visibleEntries: approved ? entries : [],
  }
}
