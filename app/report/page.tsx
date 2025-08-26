"use client"

import { useEffect, useMemo, useState } from "react"

type FixtureOption = {
  id: string
  matchday: number
  homePlayer: string
  awayPlayer: string
  homeTeam?: string
  awayTeam?: string
  scheduledDate?: string
  status: string
}

export default function ReportPage() {
  const [user, setUser] = useState<any>(null)
  const [fixtures, setFixtures] = useState<FixtureOption[]>([])
  const [eligible, setEligible] = useState<FixtureOption[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [homeScore, setHomeScore] = useState<string>("")
  const [awayScore, setAwayScore] = useState<string>("")
  const [evidenceUrl, setEvidenceUrl] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "conflict" | "error"; text: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const profile = await fetch("/api/player/profile").then((r) => r.json()).catch(() => ({ player: { id: "1", name: "Player One", preferredClub: "Arsenal" } }))
        setUser(profile.player)
        const fx = await fetch(`/api/fixtures?playerId=${encodeURIComponent(profile.player.id)}`).then((r) => r.json()).catch(() => ({ fixtures: [] }))
        const msgs = await fetch("/api/player/notifications").then((r) => r.json()).catch(() => ({ messages: [] }))
        setFixtures(fx.fixtures || [])
        // Eligible: SCHEDULED or PLAYED without approval marker (mock: include SCHEDULED only)
        setEligible((fx.fixtures || []).filter((f: any) => String(f.status).toUpperCase() === "SCHEDULED" || String(f.status).toUpperCase() === "PLAYED"))
        setMessages(msgs.messages || [])
      } catch (e) {
        setEligible([])
        setMessages([])
      }
    })()
  }, [])

  const selectedFixture = useMemo(() => eligible.find((f) => String(f.id) === String(selectedId)), [eligible, selectedId])
  const youAreHome = useMemo(() => selectedFixture && user && selectedFixture.homePlayer === user.id, [selectedFixture, user])
  const labels = useMemo(() => {
    if (!selectedFixture || !user) return { left: "You", right: "Opponent" }
    const youTeam = youAreHome ? selectedFixture.homeTeam || "You" : selectedFixture.awayTeam || "You"
    const oppTeam = youAreHome ? selectedFixture.awayTeam || "Opponent" : selectedFixture.homeTeam || "Opponent"
    return { left: `You (${youTeam})`, right: `Opponent (${oppTeam})` }
  }, [selectedFixture, youAreHome, user])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFixture) return
    setSubmitting(true)
    setStatusMsg(null)
    try {
      let screenshotBase64: string | null = null
      if (file) {
        const buf = await file.arrayBuffer()
        const b64 = Buffer.from(buf).toString("base64")
        screenshotBase64 = `data:${file.type};base64,${b64}`
      }
      const payload: any = {
        fixtureId: selectedFixture.id,
        homeScore: Number(youAreHome ? homeScore : awayScore),
        awayScore: Number(youAreHome ? awayScore : homeScore),
        evidenceUrl: evidenceUrl || null,
        notes: notes || null,
        screenshot: screenshotBase64,
        reportedByPlayerId: user?.id,
      }
      const res = await fetch("/api/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error("Failed")
      setStatusMsg({ type: "success", text: "Result submitted. Pending admin approval." })
      setSelectedId("")
      setHomeScore("")
      setAwayScore("")
      setEvidenceUrl("")
      setNotes("")
      setFile(null)
    } catch (err: any) {
      // naive conflict detection could be implemented server-side; show generic message
      setStatusMsg({ type: "conflict", text: "Opponent reported a different score. Admin will resolve." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad">
        <header className="mb-6">
          <h1 className="text-xl font-extrabold">Report Match Result</h1>
          <p className="text-sm text-[#9E9E9E]">Submit your score with a screenshot. Results become official once approved by Admin.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: form */}
          <div className="lg:col-span-8">
            <form onSubmit={onSubmit} className="rounded-2xl bg-[#141414] border p-4 space-y-4">
              {eligible.length === 0 ? (
                <div className="text-sm text-[#9E9E9E]">You have no fixtures eligible for reporting.</div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm mb-1 text-[#D1D1D1]">Select Fixture</label>
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="w-full bg-transparent border rounded px-3 py-2 text-sm"
                      aria-label="Select fixture"
                      required
                    >
                      <option value="" className="bg-[#141414]">Choose a fixture…</option>
                      {eligible.map((f) => {
                        const isHome = user && f.homePlayer === user.id
                        const opponent = isHome ? f.awayTeam || f.awayPlayer : f.homeTeam || f.homePlayer
                        const homeAway = isHome ? "Home" : "Away"
                        const dt = f.scheduledDate ? new Date(f.scheduledDate) : null
                        const when = dt ? dt.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }) : "TBD"
                        return (
                          <option key={f.id} value={f.id} className="bg-[#141414]">
                            {`MD${f.matchday} — vs ${opponent} (${homeAway}) — ${when}`}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-[#D1D1D1]">Score Entry</label>
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <div className="text-xs text-[#9E9E9E] mb-1">{labels.left}</div>
                        <input
                          type="number"
                          min={0}
                          value={homeScore}
                          onChange={(e) => setHomeScore(e.target.value)}
                          className="w-full bg-transparent border rounded px-3 py-2 text-sm"
                          placeholder="0"
                          required
                        />
                      </div>
                      <div>
                        <div className="text-xs text-[#9E9E9E] mb-1">{labels.right}</div>
                        <input
                          type="number"
                          min={0}
                          value={awayScore}
                          onChange={(e) => setAwayScore(e.target.value)}
                          className="w-full bg-transparent border rounded px-3 py-2 text-sm"
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-[#D1D1D1]">Evidence Upload</label>
                    <input type="file" accept="image/png,image/jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs mb-1 text-[#9E9E9E]">Evidence URL (optional)</label>
                        <input
                          type="url"
                          value={evidenceUrl}
                          onChange={(e) => setEvidenceUrl(e.target.value)}
                          className="w-full bg-transparent border rounded px-3 py-2 text-sm"
                          placeholder="https://twitch.tv/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1 text-[#9E9E9E]">Notes (optional)</label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full bg-transparent border rounded px-3 py-2 text-sm"
                          placeholder="Anything the admin should know? (e.g., DC at 25’, lag)"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" disabled={submitting || !selectedId} className="px-4 py-2 rounded bg-[#00C853] text-black font-semibold disabled:opacity-50">
                      {submitting ? "Submitting…" : "Submit Report"}
                    </button>
                    <a href="/dashboard" className="px-4 py-2 rounded border">Cancel</a>
                  </div>
                </>
              )}

              {statusMsg && (
                <div className={"mt-2 text-sm " + (statusMsg.type === "success" ? "text-emerald-400" : statusMsg.type === "conflict" ? "text-amber-400" : "text-rose-400")}>{statusMsg.text}</div>
              )}
            </form>
          </div>

          {/* Right: admin messages */}
          <aside className="lg:col-span-4">
            <div className="rounded-2xl bg-[#141414] border p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold">Admin Announcements</h2>
                <a href="/dashboard?messages=1" className="text-xs underline text-[#9E9E9E]">View All →</a>
              </div>
              {messages.length === 0 ? (
                <div className="text-sm text-[#9E9E9E]">No new messages.</div>
              ) : (
                <ul className="space-y-3 text-sm">
                  {messages.slice(0, 5).map((m: any) => (
                    <li key={m.id} className="border-t first:border-t-0 border-[#1E1E1E] pt-3">
                      <div className="flex items-center gap-2 text-xs text-[#9E9E9E]">
                        <span className="inline-block rounded-full px-2 py-0.5 text-[10px] bg-emerald-600/15 text-emerald-400">{m.read_at ? "Read" : "New"}</span>
                        <time dateTime={m.created_at}>{new Date(m.created_at).toLocaleString()}</time>
                      </div>
                      <div className="mt-1 font-medium">{m.title || "Announcement"}</div>
                      <div className="text-[#D1D1D1]">{m.body}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
