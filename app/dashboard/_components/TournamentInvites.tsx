"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { CheckCircle2, Clock3, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FIFA_CLUBS } from "@/lib/constants"

import type { HubEntry as TournamentInvite } from "@/lib/dashboard/player-hub"
import { respondToInvitation } from "@/lib/dashboard/load-player-hub"

const clubOptions = Array.from(new Set(FIFA_CLUBS))

export default function TournamentInvites({
  entries,
  onUpdate,
}: {
  entries: TournamentInvite[]
  onUpdate: () => Promise<void>
}) {
  const [selectedClubByTournament, setSelectedClubByTournament] = useState<Record<string, string>>(
    {},
  )
  const [busyId, setBusyId] = useState<string | null>(null)

  const pending = useMemo(
    () =>
      entries.filter(
        (entry) =>
          entry.status === "invited" &&
          !["COMPLETE", "COMPLETED", "CANCELLED"].includes(entry.tournament.status.toUpperCase()),
      ),
    [entries],
  )
  const responded = useMemo(
    () => entries.filter((entry) => !pending.includes(entry)),
    [entries, pending],
  )

  const respond = async (entry: TournamentInvite, action: "accept" | "decline") => {
    if (busyId) return
    const selectedClub = selectedClubByTournament[entry.tournament_id]
    if (action === "accept" && !selectedClub) {
      toast.error("Choose a club before accepting")
      return
    }

    setBusyId(entry.id)
    try {
      await respondToInvitation(entry.tournament_id, action, selectedClub, onUpdate)
      toast.success(action === "accept" ? "Tournament accepted" : "Tournament declined")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't save your response. Please try again.",
      )
    } finally {
      setBusyId(null)
    }
  }

  if (entries.length === 0) return null

  return (
    <section
      id="tournament-invites"
      aria-label="Tournament invitations"
      className="fc-hub-invites rounded-2xl border border-[#1E2A22] bg-[#101410] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A9A8D]">
            Tournament Invites
          </div>
          <h2 className="mt-1 font-heading text-xl text-white">Your tournaments</h2>
        </div>
        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
          {pending.length} pending
        </span>
      </div>

      <div className="space-y-3">
        {pending.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-[#243026] bg-[#0B0E0C] p-3">
            <InviteHeader entry={entry} />
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <Select
                value={selectedClubByTournament[entry.tournament_id] || ""}
                onValueChange={(club) =>
                  setSelectedClubByTournament((prev) => ({ ...prev, [entry.tournament_id]: club }))
                }
              >
                <SelectTrigger
                  aria-label={`Choose your club for ${entry.tournament.name}`}
                  disabled={busyId !== null}
                  className="border-[#243026] bg-[#101410]"
                >
                  <SelectValue placeholder="Choose your club" />
                </SelectTrigger>
                <SelectContent>
                  {clubOptions.map((club) => (
                    <SelectItem key={club} value={club}>
                      {club}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button disabled={busyId !== null} onClick={() => respond(entry, "accept")}>
                <CheckCircle2 className="h-4 w-4" /> Accept
              </Button>
              <Button
                variant="outline"
                disabled={busyId !== null}
                onClick={() => respond(entry, "decline")}
              >
                <XCircle className="h-4 w-4" /> Decline
              </Button>
            </div>
          </div>
        ))}

        {responded.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-[#243026] bg-[#0B0E0C] p-3">
            <InviteHeader entry={entry} />
            <div className="mt-2 text-xs text-[#A7B2A2]">
              {entry.status === "accepted"
                ? `Accepted with ${entry.selected_club || "club pending"}`
                : entry.status === "declined"
                  ? "Declined"
                  : "Tournament closed"}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function InviteHeader({ entry }: { entry: TournamentInvite }) {
  const statusClass =
    entry.status === "accepted"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
      : entry.status === "declined"
        ? "border-rose-500/25 bg-rose-500/10 text-rose-200"
        : "border-amber-500/25 bg-amber-500/10 text-amber-200"

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-white">{entry.tournament.name}</div>
        <div className="mt-1 text-xs text-[#8A9A8D]">
          {entry.tournament.season || "Season not set"} - {entry.tournament.status}
        </div>
      </div>
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${statusClass}`}
      >
        {entry.status === "invited" ? <Clock3 className="h-3 w-3" /> : null}
        {entry.status}
      </span>
    </div>
  )
}
