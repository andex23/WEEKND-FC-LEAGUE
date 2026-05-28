function normalizeEntryStatus(status) {
  const normalized = String(status || "invited").toLowerCase()
  return ["invited", "accepted", "declined"].includes(normalized) ? normalized : "invited"
}

function playerFromEntry(entry) {
  if (Array.isArray(entry?.player)) return entry.player[0]
  if (entry?.player) return entry.player
  if (Array.isArray(entry?.players)) return entry.players[0]
  return entry?.players || null
}

function acceptedEntriesToFixtureRoster(entries) {
  return (entries || [])
    .filter((entry) => normalizeEntryStatus(entry?.status) === "accepted")
    .map((entry) => {
      const selectedClub = String(entry?.selected_club || "").trim()
      const player = playerFromEntry(entry)
      if (!entry?.player_id || !selectedClub) return null
      return {
        id: String(entry.player_id),
        name: player?.name || entry.player_name || "Player",
        assignedTeam: selectedClub,
        preferredClub: selectedClub,
        entryId: entry.id ? String(entry.id) : undefined,
      }
    })
    .filter(Boolean)
}

module.exports = {
  acceptedEntriesToFixtureRoster,
  normalizeEntryStatus,
}
