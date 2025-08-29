import { NextResponse } from "next/server"
import { activePlayers, snapshotTournamentPlayers, syncTournamentPlayers, getTournamentPlayers } from "@/lib/mocks/players"

// Globalize tournaments store to persist during dev
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any
if (!g.__memTournaments) g.__memTournaments = [] as any[]
let tournaments: any[] = g.__memTournaments

export async function GET() { return NextResponse.json({ tournaments }) }

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { action } = body
  if (action === "create") {
    const id = Math.random().toString(36).slice(2,10)
    // Prefer explicit rosterIds/rosterRecords from client if provided
    let roster: any[] = []
    if (Array.isArray(body.rosterRecords) && body.rosterRecords.length) {
      roster = body.rosterRecords
    }
    // Otherwise, read latest active players (try API first, then memory)
    if (roster.length === 0) {
      roster = activePlayers()
    }
    try {
      const base = (process.env.NEXT_PUBLIC_SITE_URL || "").trim() || (new URL(req.url)).origin
      const res = await fetch(new URL("/api/admin/players", base))
      if (res.ok) {
        const data = await res.json()
        const apiPlayers = Array.isArray(data?.players) ? data.players : []
        const act = apiPlayers.filter((p: any) => !!p.active).map((p:any)=>({ id: String(p.id), name: p.name, preferred_club: p.preferred_club || "" }))
        if (act.length > roster.length) roster = act
      }
    } catch {}
    if (roster.length < 6) return NextResponse.json({ error: "Need at least 6 players" }, { status: 400 })
    // Allow odd player counts; BYE is handled during fixture generation
    const t = {
      id,
      name: body.name || "New Tournament",
      status: body.status || "DRAFT",
      season: body.season || "",
      type: (body.type || "DOUBLE").toUpperCase(),
      players: roster.length,
      rules: body.rules || "",
      match_length: body.match_length || 6,
      matchdays: body.matchdays || ["Sat","Sun"],
      start_at: body.start_at || null,
      end_at: body.end_at || null,
      created_at: new Date().toISOString(),
    }
    tournaments = [t, ...tournaments]
    g.__memTournaments = tournaments
    snapshotTournamentPlayers(id)
    // If created as ACTIVE, set as active in settings
    if (String(t.status).toUpperCase() === "ACTIVE") {
      if (!g.__adminSettings) g.__adminSettings = {}
      g.__adminSettings.tournament = {
        ...(g.__adminSettings.tournament || {}),
        name: t.name,
        status: "ACTIVE",
        active_tournament_id: t.id,
        season: t.season,
        format: t.type,
      }
    }
    return NextResponse.json({ ok:true, tournament: t, snapshotted: roster.length })
  }
  if (action === "update") {
    const { id, patch } = body
    tournaments = tournaments.map((t) => (t.id === id ? { ...t, ...patch } : t))
    g.__memTournaments = tournaments
    return NextResponse.json({ ok:true })
  }
  if (action === "delete") {
    const { id } = body
    tournaments = tournaments.filter((t) => t.id !== id)
    g.__memTournaments = tournaments
    // Remove fixtures for this tournament
    if (g.__memoryFixtures) {
      g.__memoryFixtures = (g.__memoryFixtures || []).filter((f: any) => String(f.tournamentId || "") !== String(id))
    }
    // Remove tournament players snapshot if present
    if (g.__memTournamentPlayers) {
      const snaps = g.__memTournamentPlayers
      if (snaps && typeof snaps === "object") {
        delete snaps[id]
        g.__memTournamentPlayers = snaps
      }
    }
    // Clear active tournament if it was this one
    if (g.__adminSettings?.tournament?.active_tournament_id === id) {
      g.__adminSettings.tournament = { ...(g.__adminSettings.tournament || {}), status: "INACTIVE", active_tournament_id: null }
    }
    return NextResponse.json({ ok:true })
  }
  if (action === "sync_roster") {
    const { id } = body
    const after = syncTournamentPlayers(id)
    // Update tournament visible players count to reflect latest snapshot
    tournaments = tournaments.map((t) => (t.id === id ? { ...t, players: after.length } : t))
    g.__memTournaments = tournaments
    return NextResponse.json({ ok: true, count: after.length })
  }
  if (action === "roster") {
    const { id } = body
    return NextResponse.json({ players: getTournamentPlayers(id) })
  }
  return NextResponse.json({ ok:false, error:"unknown action" }, { status:400 })
}
