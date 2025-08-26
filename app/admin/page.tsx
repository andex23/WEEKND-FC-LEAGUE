"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, usePathname } from "next/navigation"
import { StandingsTab } from "@/components/admin/standings-tab"
import { ChevronLeft, ChevronRight, Download, Filter as FilterIcon, Search as SearchIcon, Plus } from "lucide-react"
import { SettingsPage } from "@/components/admin/settings-page"

export default function AdminDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const [section, setSection] = useState<"overview" | "registrations" | "stats" | "reports" | "messaging" | "settings">(
    "overview",
  )

  const [players, setPlayers] = useState<any[]>([])
  const [standings, setStandings] = useState<any[]>([])
  const [fixtures, setFixtures] = useState<any[]>([])
  const [leagueSettings, setLeagueSettings] = useState<any>(null)
  const [playerStats, setPlayerStats] = useState<any>(null)
  const [resultsQueue, setResultsQueue] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [regsRes, standingsRes, fixturesRes, statusRes, statsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/registrations"),
        fetch("/api/standings"),
        fetch("/api/fixtures"),
        fetch("/api/league/status"),
        fetch("/api/player-stats"),
        fetch("/api/admin/settings").catch(() => null),
      ])

      const regsData = await regsRes.json()
      const standingsData = await standingsRes.json()
      const fixturesData = await fixturesRes.json()
      const statusData = await statusRes.json()
      const statsData = await statsRes.json()
      const settingsData = settingsRes ? await settingsRes.json() : null

      setPlayers(regsData.registrations || [])
      setStandings(standingsData.standings || [])
      setFixtures(fixturesData.fixtures || [])
      setLeagueSettings(settingsData?.tournament ? { ...(statusData || {}), name: settingsData.branding?.league_name || settingsData.tournament?.name, status: settingsData.tournament?.status || (statusData?.status || "DRAFT") } : (statusData || {}))
      setPlayerStats(statsData || null)

      try {
        const rq = await fetch("/api/admin/results")
        if (rq.ok) {
          const rqData = await rq.json()
          setResultsQueue(rqData.results || [])
        } else {
          setResultsQueue([])
        }
      } catch {
        setResultsQueue([])
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const pendingRegistrations = useMemo(
    () => players.filter((p) => (p.status || "pending").toLowerCase() === "pending"),
    [players],
  )
  const approvedPlayers = useMemo(
    () => players.filter((p) => (p.status || "pending").toLowerCase() === "approved"),
    [players],
  )

  const approvePlayer = async (playerId: string) => {
    try {
      const response = await fetch("/api/admin/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action: "approve" }),
      })
      if (response.ok) fetchAllData()
    } catch (err) {
      console.error("Error approving player:", err)
    }
  }

  const rejectPlayer = async (playerId: string) => {
    try {
      const response = await fetch("/api/admin/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action: "reject" }),
      })
      if (response.ok) fetchAllData()
    } catch (err) {
      console.error("Error rejecting player:", err)
    }
  }

  const bulkApproveAll = async () => {
    for (const p of pendingRegistrations) {
      // eslint-disable-next-line no-await-in-loop
      await approvePlayer(p.id)
    }
  }

  const approveAllReports = async () => {
    try {
      // Attempt backend endpoint if exists, otherwise fall back to local clear
      const res = await fetch("/api/admin/results/approve-all", { method: "POST" })
      if (!res.ok) throw new Error("fallback")
    } catch {
      setResultsQueue([])
    }
  }

  const matchesPlayed = useMemo(() => fixtures.filter((f) => (f.status || f.Status || f.status)?.toUpperCase?.() === "PLAYED").length, [fixtures])
  const matchesPendingApproval = useMemo(() => resultsQueue.filter((r) => (r.status || "").toUpperCase() !== "APPROVED").length, [resultsQueue])

  const recentReports7d = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return resultsQueue.filter((r) => {
      const dateString = (r?.created_at || r?.createdAt || r?.submitted_at || r?.submittedAt || r?.date || r?.timestamp) as string | undefined
      if (!dateString) return false
      const t = Date.parse(dateString)
      return Number.isFinite(t) && t >= cutoff
    }).length
  }, [resultsQueue])

  // Registrations page state: search, selection, pagination
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const normalize = (v: any) => (typeof v === "string" ? v.toLowerCase() : "")

  const filteredPlayers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return players
    return players.filter((p) => {
      const name = normalize(p.name)
      const tag = normalize(p.username || p.gamertag || p.gamer_tag || p.handle)
      const email = normalize(p.email || p.email_address || p.user?.email)
      const club = normalize(p.preferred_team || p.preferred_club)
      const location = normalize(p.location || p.city || p.country)
      return name.includes(q) || tag.includes(q) || email.includes(q) || club.includes(q) || location.includes(q)
    })
  }, [players, query])

  const rejectedCount = useMemo(
    () => players.filter((p) => (p.status || "").toLowerCase() === "rejected").length,
    [players],
  )

  const conflictsCount = useMemo(() => {
    const seen = new Map<string, number>()
    let conflicts = 0
    for (const p of players) {
      const key = (p.email || p.email_address || p.user?.email || p.username || p.gamertag || p.gamer_tag || "") as string
      if (!key) continue
      const k = key.toLowerCase()
      const count = (seen.get(k) || 0) + 1
      seen.set(k, count)
      if (count === 2) conflicts += 2
      else if (count > 2) conflicts += 1
    }
    return conflicts
  }, [players])

  const pageCount = Math.max(1, Math.ceil(filteredPlayers.length / rowsPerPage))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * rowsPerPage
  const pageRows = filteredPlayers.slice(pageStart, pageStart + rowsPerPage)

  const allVisibleSelected = pageRows.length > 0 && pageRows.every((p) => selectedIds.has(p.id))

  const toggleSelectAll = () => {
    const next = new Set(selectedIds)
    if (allVisibleSelected) {
      pageRows.forEach((p) => next.delete(p.id))
    } else {
      pageRows.forEach((p) => next.add(p.id))
    }
    setSelectedIds(next)
  }

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const bulkAction = async (action: "approve" | "reject") => {
    for (const id of selectedIds) {
      if (action === "approve") await approvePlayer(id)
      else await rejectPlayer(id)
    }
    setSelectedIds(new Set())
    fetchAllData()
  }

  const exportVisibleToCsv = () => {
    const rows = [
      ["Player", "Gamer Tag", "Email", "Console", "Club", "Location", "Status"],
      ...pageRows.map((p) => [
        p.name ?? "",
        p.username || p.gamertag || p.gamer_tag || "",
        p.email || p.email_address || p.user?.email || "",
        p.console || "",
        p.preferred_team || p.preferred_club || "",
        p.location || p.city || p.country || "",
        p.status || "",
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll("\"", "\"\"")}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "registrations.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Reports page state: search, selection, pagination
  const [reportQuery, setReportQuery] = useState("")
  const [reportPage, setReportPage] = useState(1)
  const [reportRowsPerPage, setReportRowsPerPage] = useState(25)
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set())

  const filteredReports = useMemo(() => {
    const q = reportQuery.trim().toLowerCase()
    if (!q) return resultsQueue
    return resultsQueue.filter((r) => {
      const home = normalize(r.homePlayer)
      const away = normalize(r.awayPlayer)
      const by = normalize(r.submittedBy)
      const reason = normalize(r.reason)
      const status = normalize(r.status)
      return home.includes(q) || away.includes(q) || by.includes(q) || reason.includes(q) || status.includes(q)
    })
  }, [resultsQueue, reportQuery])

  const reportsPageCount = Math.max(1, Math.ceil(filteredReports.length / reportRowsPerPage))
  const reportsCurrentPage = Math.min(reportPage, reportsPageCount)
  const reportsStart = (reportsCurrentPage - 1) * reportRowsPerPage
  const reportPageRows = filteredReports.slice(reportsStart, reportsStart + reportRowsPerPage)

  const allReportsSelected = reportPageRows.length > 0 && reportPageRows.every((r) => selectedReportIds.has(r.id))

  const toggleSelectAllReports = () => {
    const next = new Set(selectedReportIds)
    if (allReportsSelected) reportPageRows.forEach((r) => next.delete(r.id))
    else reportPageRows.forEach((r) => next.add(r.id))
    setSelectedReportIds(next)
  }

  const toggleSelectOneReport = (id: string) => {
    const next = new Set(selectedReportIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedReportIds(next)
  }

  const approveReport = async (id: string) => {
    try {
      // Try a specific endpoint if available, otherwise fall back to remove from queue
      const res = await fetch("/api/admin/results/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
      if (!res.ok) throw new Error("fallback")
    } catch {
      setResultsQueue((prev) => prev.filter((r) => r.id !== id))
    }
  }

  const bulkApproveReports = async () => {
    for (const id of selectedReportIds) {
      // eslint-disable-next-line no-await-in-loop
      await approveReport(id)
    }
    setSelectedReportIds(new Set())
    fetchAllData()
  }

  const exportReportsCsv = () => {
    const rows = [
      ["Home", "Away", "Score", "Submitted By", "Status", "Reason"],
      ...reportPageRows.map((r) => [
        r.homePlayer ?? "",
        r.awayPlayer ?? "",
        `${r.homeScore ?? ""}-${r.awayScore ?? ""}`,
        r.submittedBy ?? "",
        r.status ?? "",
        r.reason ?? "",
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll("\"", "\"\"")}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "reports.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Messaging state and helpers
  type AdminMessage = { id: string; type: "broadcast" | "direct"; toId?: string; toName?: string; content: string; createdAt: string; status: "sent" | "queued" }
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [broadcastText, setBroadcastText] = useState("")
  const [directPlayerId, setDirectPlayerId] = useState<string | undefined>(undefined)
  const [directText, setDirectText] = useState("")
  const [messageQuery, setMessageQuery] = useState("")
  const [messageType, setMessageType] = useState<"all" | "broadcast" | "direct">("all")

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_messages")
      if (raw) setMessages(JSON.parse(raw))
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem("admin_messages", JSON.stringify(messages))
    } catch {}
  }, [messages])

  const filteredMessages = useMemo(() => {
    const q = messageQuery.trim().toLowerCase()
    return messages.filter((m) => {
      if (messageType !== "all" && m.type !== messageType) return false
      if (!q) return true
      const content = normalize(m.content)
      const toName = normalize(m.toName)
      return content.includes(q) || toName.includes(q)
    })
  }, [messages, messageQuery, messageType])

  const exportMessagesCsv = () => {
    const rows = [
      ["Type", "To", "Content", "Date"],
      ...filteredMessages.map((m) => [m.type, m.toName || "All", m.content, new Date(m.createdAt).toLocaleString()]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll("\"", "\"\"")}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "messages.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const sendBroadcast = async () => {
    if (!broadcastText.trim()) return
    const message: AdminMessage = { id: `${Date.now()}-${Math.random()}`, type: "broadcast", content: broadcastText.trim(), createdAt: new Date().toISOString(), status: "sent" }
    setMessages((prev) => [message, ...prev])
    setBroadcastText("")
  }

  const sendDirect = async () => {
    if (!directText.trim() || !directPlayerId) return
    const player = players.find((p) => String(p.id) === String(directPlayerId))
    const message: AdminMessage = { id: `${Date.now()}-${Math.random()}`, type: "direct", toId: String(directPlayerId), toName: player?.name || "Unknown", content: directText.trim(), createdAt: new Date().toISOString(), status: "sent" }
    setMessages((prev) => [message, ...prev])
    setDirectText("")
    setDirectPlayerId(undefined)
  }

  const clearMessages = () => setMessages([])

  const goSetup = () => router.push("/admin/setup")

  const leagueActive = (leagueSettings?.status || "DRAFT").toUpperCase() === "ACTIVE"

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <div className="text-[#9E9E9E]">Loading admin...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400 mb-4">{error}</p>
          <Button onClick={fetchAllData} className="bg-[#00C853] text-black hover:bg-[#00C853]/90">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-extrabold">Admin</h1>
            <p className="text-sm text-[#9E9E9E]">Manage the Weekend FC League</p>
          </div>
        </div>
        {String(leagueSettings?.status || "").toUpperCase() === "COMPLETED" && (
          <div className="mb-6 border rounded-md p-3 bg-[#141414] text-[#D1D1D1] text-sm">
            Tournament is completed. Editing fixtures and approving new results are disabled.
          </div>
        )}

        <div className="flex gap-8">
          <aside className="w-64 shrink-0">
            <nav className="space-y-1">
              {[
                { key: "overview", label: "Overview" },
                { key: "registrations", label: "Registrations" },
                { key: "fixtures", label: "Fixtures" },
                { key: "tournaments", label: "Tournaments" },
                { key: "stats", label: "Stats" },
                { key: "reports", label: "Reports" },
                { key: "messaging", label: "Messaging" },
                { key: "settings", label: "Settings" },
              ].map((item) => {
                const isActive = section === item.key || ((item.key === "fixtures" || item.key === "tournaments") && (pathname || "").startsWith(`/admin/${item.key}`))
                return (
                  <button
                    key={item.key}
                    onClick={() => (item.key === "fixtures" ? router.push("/admin/fixtures") : item.key === "tournaments" ? router.push("/admin/tournaments") : setSection(item.key as any))}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm border ${
                      isActive ? "bg-[#141414] border-[#1E1E1E]" : "bg-transparent hover:bg-[#141414] border-transparent"
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          <section className="flex-1">
            {section === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="rounded-2xl p-4 border bg-[#141414]">
                    <div className="text-xs text-[#9E9E9E]">Registered Players</div>
                    <div className="text-2xl font-bold tabular-nums text-[#00C853]">{players.length}</div>
                  </div>
                  <div className="rounded-2xl p-4 border bg-[#141414]">
                    <div className="text-xs text-[#9E9E9E]">Fixtures Created</div>
                    <div className="text-2xl font-bold tabular-nums text-[#00C853]">{fixtures.length}</div>
                  </div>
                  <div className="rounded-2xl p-4 border bg-[#141414]">
                    <div className="text-xs text-[#9E9E9E]">Matches Played</div>
                    <div className="text-2xl font-bold tabular-nums text-[#00C853]">{matchesPlayed}</div>
                  </div>
                  <div className="rounded-2xl p-4 border bg-[#141414]">
                    <div className="text-xs text-[#9E9E9E]">Pending Approval</div>
                    <div className="text-2xl font-bold tabular-nums text-[#00C853]">{matchesPendingApproval}</div>
                  </div>
                  <div className="rounded-2xl p-4 border bg-[#141414]">
                    <div className="text-xs text-[#9E9E9E]">League Status</div>
                    <div className="text-sm font-semibold">{leagueSettings?.status || "DRAFT"}</div>
                  </div>
                </div>

                {leagueActive && fixtures.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl p-4 border bg-[#141414]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold">League Standings (Top 5)</div>
                        <Button variant="outline" size="sm" onClick={() => setSection("stats" as any)}>Open Stats</Button>
                      </div>
                      {standings && standings.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead className="text-[#9E9E9E]">
                            <tr>
                              <th className="text-left px-3 py-2">Player</th>
                              <th className="text-right px-3 py-2">Pts</th>
                              <th className="text-right px-3 py-2">P</th>
                              <th className="text-right px-3 py-2">GD</th>
                            </tr>
                          </thead>
                          <tbody>
                            {standings.slice(0, 5).map((s: any) => (
                              <tr key={s.playerId} className="border-t border-[#1E1E1E]">
                                <td className="px-3 py-2">{s.playerName}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{s.points}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{s.played}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{s.goalDifference}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-sm text-[#9E9E9E]">Standings unavailable.</div>
                      )}
                    </div>

                    <div className="rounded-2xl p-4 border bg-[#141414]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold">Stats Leaders</div>
                        <Button variant="outline" size="sm" onClick={() => setSection("stats" as any)}>Open Stats</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <div className="text-xs text-[#9E9E9E] mb-1">Top Scorers</div>
                          {playerStats?.topScorers?.slice(0, 3)?.map((p: any) => (
                            <div key={p.id || p.player_id || p.playerId || p.name} className="text-sm flex items-center justify-between">
                              <span className="truncate mr-2">{p.name || p.player_name || p.player}</span>
                              <span className="tabular-nums text-[#D1D1D1]">{p.goals || p.G || 0}</span>
                            </div>
                          )) || <div className="text-xs text-[#9E9E9E]">—</div>}
                        </div>
                        <div>
                          <div className="text-xs text-[#9E9E9E] mb-1">Top Assists</div>
                          {playerStats?.topAssists?.slice(0, 3)?.map((p: any) => (
                            <div key={p.id || p.player_id || p.playerId || p.name} className="text-sm flex items-center justify-between">
                              <span className="truncate mr-2">{p.name || p.player_name || p.player}</span>
                              <span className="tabular-nums text-[#D1D1D1]">{p.assists || p.A || 0}</span>
                            </div>
                          )) || <div className="text-xs text-[#9E9E9E]">—</div>}
                        </div>
                        <div>
                          <div className="text-xs text-[#9E9E9E] mb-1">Discipline</div>
                          {playerStats?.discipline?.slice(0, 3)?.map((p: any) => (
                            <div key={p.id || p.player_id || p.playerId || p.name} className="text-sm flex items-center justify-between">
                              <span className="truncate mr-2">{p.name || p.player_name || p.player}</span>
                              <span className="tabular-nums text-[#D1D1D1]">{(p.yellow_cards || p.YC || 0)} / {(p.red_cards || p.RC || 0)}</span>
                            </div>
                          )) || <div className="text-xs text-[#9E9E9E]">—</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-8 flex items-center justify-between border bg-[#141414]">
                    <div>
                      <div className="text-sm font-semibold">League Standings & Stats</div>
                      <div className="text-xs text-[#9E9E9E]">No league yet. Create one to see standings and leaders here.</div>
                    </div>
                    <Button onClick={goSetup} className="bg-[#00C853] text-black hover:bg-[#00C853]/90"><Plus className="h-4 w-4 mr-2" /> Create League</Button>
                  </div>
                )}

                <div className="rounded-2xl p-4 border bg-[#141414] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Reports</div>
                    <div className="text-xs text-[#9E9E9E]">Pending {matchesPendingApproval} • Last 7 days {recentReports7d}</div>
                  </div>
                  <Button variant="outline" onClick={() => setSection("reports" as any)}>View Reports</Button>
                </div>
              </div>
            )}

            {section === "registrations" && (
              <div className="space-y-6">
                <h2 className="text-[26px] font-extrabold">Registrations</h2>

                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-[#141414]">
                    <SearchIcon className="h-4 w-4 text-[#9E9E9E]" />
                    <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Search" className="h-7 border-0 focus-visible:ring-0 p-0 bg-transparent" />
                  </div>
                  <Button variant="outline" className="h-9"> 
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Select onValueChange={async (v) => { if (v === "approve") await bulkAction("approve"); if (v === "reject") await bulkAction("reject") }}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue placeholder="Bulk Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve selected</SelectItem>
                      <SelectItem value="reject">Reject selected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="h-9" onClick={exportVisibleToCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="px-4 py-2 rounded-md border bg-[#141414] text-sm">Total: <span className="font-semibold">{players.length}</span></div>
                  <div className="px-4 py-2 rounded-md border bg-emerald-900/20 text-sm text-emerald-300">Pending: <span className="font-semibold">{pendingRegistrations.length}</span></div>
                  <div className="px-4 py-2 rounded-md border bg-emerald-900/20 text-sm text-emerald-300">Approved: <span className="font-semibold">{approvedPlayers.length}</span></div>
                  <div className="px-4 py-2 rounded-md border bg-rose-900/20 text-sm text-rose-300">Rejected: <span className="font-semibold">{rejectedCount}</span></div>
                  <div className="px-4 py-2 rounded-md border bg-amber-900/20 text-sm text-amber-300">Conflicts: <span className="font-semibold">{conflictsCount}</span></div>
                </div>

                <div className="overflow-x-auto rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="text-[#9E9E9E]">
                      <tr>
                        <th className="text-left px-3 py-2 w-8">
                          <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
                        </th>
                        <th className="text-left px-3 py-2">Player</th>
                        <th className="text-left px-3 py-2">Gamer Tag</th>
                        <th className="text-left px-3 py-2">Email</th>
                        <th className="text-left px-3 py-2">Console</th>
                        <th className="text-left px-3 py-2">Club</th>
                        <th className="text-left px-3 py-2">Location</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-right px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((p) => (
                        <tr key={p.id} className="border-t border-[#1E1E1E]">
                          <td className="px-3 py-2 w-8">
                            <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelectOne(p.id)} />
                          </td>
                          <td className="px-3 py-2">{p.name}</td>
                          <td className="px-3 py-2">{p.username || p.gamertag || p.gamer_tag || "—"}</td>
                          <td className="px-3 py-2">{p.email || p.email_address || p.user?.email || "—"}</td>
                          <td className="px-3 py-2">{p.console || "—"}</td>
                          <td className="px-3 py-2">{p.preferred_team || p.preferred_club || "—"}</td>
                          <td className="px-3 py-2">{p.location || p.city || p.country || "—"}</td>
                          <td className="px-3 py-2">
                            {(p.status || "pending").toLowerCase() === "approved" ? (
                              <span className="px-2 py-0.5 text-xs rounded border bg-emerald-600/15 text-emerald-300">Approved</span>
                            ) : (p.status || "pending").toLowerCase() === "rejected" ? (
                              <span className="px-2 py-0.5 text-xs rounded border bg-rose-600/15 text-rose-300">Rejected</span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs rounded border bg-amber-600/15 text-amber-300">Pending</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {(p.status || "pending").toLowerCase() === "pending" ? (
                              <Button size="sm" variant="ghost" className="text-white hover:bg-[#141414]" onClick={async () => { await approvePlayer(p.id); }}>
                                Review
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="text-white/70 hover:bg-[#141414]">
                                Edit
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-[#9E9E9E]">Rows per page: {rowsPerPage}</div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-[#141414] rounded" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: pageCount }).slice(0, 5).map((_, i) => {
                      const num = i + 1
                      return (
                        <button key={num} onClick={() => setPage(num)} className={`h-8 w-8 rounded ${currentPage === num ? "bg-white text-black" : "hover:bg-[#141414]"}`}>
                          {num}
                        </button>
                      )
                    })}
                    <button className="p-2 hover:bg-[#141414] rounded" disabled={currentPage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {section === "reports" && (
              <div className="space-y-6">
                <h2 className="text-[26px] font-extrabold">Reports</h2>

                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-[#141414]">
                    <SearchIcon className="h-4 w-4 text-[#9E9E9E]" />
                    <Input value={reportQuery} onChange={(e) => { setReportQuery(e.target.value); setReportPage(1) }} placeholder="Search" className="h-7 border-0 focus-visible:ring-0 p-0 bg-transparent" />
                  </div>
                  <Button variant="outline" className="h-9">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Select onValueChange={async (v) => { if (v === "approve") await bulkApproveReports() }}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue placeholder="Bulk Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve selected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="h-9" onClick={exportReportsCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="px-4 py-2 rounded-md border bg-[#141414] text-sm">Total: <span className="font-semibold">{resultsQueue.length}</span></div>
                  <div className="px-4 py-2 rounded-md border bg-amber-900/20 text-sm text-amber-300">Pending: <span className="font-semibold">{matchesPendingApproval}</span></div>
                </div>

                <div className="overflow-x-auto rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="text-[#9E9E9E]">
                      <tr>
                        <th className="text-left px-3 py-2 w-8">
                          <input type="checkbox" checked={allReportsSelected} onChange={toggleSelectAllReports} />
                        </th>
                        <th className="text-left px-3 py-2">Match</th>
                        <th className="text-left px-3 py-2">Submitted By</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-left px-3 py-2">Reason</th>
                        <th className="text-right px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportPageRows.map((r) => (
                        <tr key={r.id} className="border-t border-[#1E1E1E]">
                          <td className="px-3 py-2 w-8">
                            <input type="checkbox" checked={selectedReportIds.has(r.id)} onChange={() => toggleSelectOneReport(r.id)} />
                          </td>
                          <td className="px-3 py-2 font-medium">{r.homePlayer} {r.homeScore} - {r.awayScore} {r.awayPlayer}</td>
                          <td className="px-3 py-2">{r.submittedBy}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 text-xs rounded border bg-amber-600/15 text-amber-300">{r.status || "Pending"}</span>
                          </td>
                          <td className="px-3 py-2 text-[#9E9E9E]">{r.reason || "Awaiting opponent confirmation"}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex gap-2">
                              <Button size="sm" className="bg-[#00C853] text-black hover:bg-[#00C853]/90" onClick={async () => { await approveReport(r.id) }} disabled={String(leagueSettings?.status || "").toUpperCase() === "COMPLETED"}>Approve</Button>
                              <Button size="sm" variant="outline">Override</Button>
                              <Button size="sm" variant="outline">Flag/Dispute</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-[#9E9E9E]">Rows per page: {reportRowsPerPage}</div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-[#141414] rounded" disabled={reportsCurrentPage <= 1} onClick={() => setReportPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: reportsPageCount }).slice(0, 5).map((_, i) => {
                      const num = i + 1
                      return (
                        <button key={num} onClick={() => setReportPage(num)} className={`h-8 w-8 rounded ${reportsCurrentPage === num ? "bg-white text-black" : "hover:bg-[#141414]"}`}>
                          {num}
                        </button>
                      )
                    })}
                    <button className="p-2 hover:bg-[#141414] rounded" disabled={reportsCurrentPage >= reportsPageCount} onClick={() => setReportPage((p) => Math.min(reportsPageCount, p + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {section === "stats" && (
              <div className="space-y-6">
                <StandingsTab />
              </div>
            )}

            {section === "messaging" && (
              <div className="space-y-6">
                <h2 className="text-[26px] font-extrabold">Messaging</h2>

                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-[#141414]">
                    <SearchIcon className="h-4 w-4 text-[#9E9E9E]" />
                    <Input value={messageQuery} onChange={(e) => setMessageQuery(e.target.value)} placeholder="Search messages" className="h-7 border-0 focus-visible:ring-0 p-0 bg-transparent" />
                  </div>
                  <Select value={messageType} onValueChange={(v) => setMessageType(v as any)}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="broadcast">Broadcast</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="h-9" onClick={exportMessagesCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" className="h-9" onClick={clearMessages}>Clear History</Button>
                </div>

                <div className="rounded-2xl border p-4 bg-[#141414]">
                  <Label className="text-sm">Global broadcast</Label>
                  <Input value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} placeholder="Write a league-wide announcement (sent to dashboards)" className="mt-2 bg-transparent" />
                  <div className="flex justify-end mt-3">
                    <Button className="bg-[#00C853] text-black hover:bg-[#00C853]/90" onClick={sendBroadcast}>Send Broadcast</Button>
                  </div>
                </div>

                <div className="rounded-2xl border p-4 bg-[#141414]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm">Player</Label>
                      <Select value={directPlayerId} onValueChange={(v) => setDirectPlayerId(v)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose player" />
                        </SelectTrigger>
                        <SelectContent>
                          {players.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm">Message</Label>
                      <Input value={directText} onChange={(e) => setDirectText(e.target.value)} placeholder="Direct message (for disputes/clarifications)" className="mt-2 bg-transparent" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button className="bg-[#00C853] text-black hover:bg-[#00C853]/90" onClick={sendDirect}>Send Message</Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="text-[#9E9E9E]">
                      <tr>
                        <th className="text-left px-3 py-2">Type</th>
                        <th className="text-left px-3 py-2">To</th>
                        <th className="text-left px-3 py-2">Message</th>
                        <th className="text-left px-3 py-2">Date</th>
                        <th className="text-right px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMessages.map((m) => (
                        <tr key={m.id} className="border-t border-[#1E1E1E]">
                          <td className="px-3 py-2 capitalize">{m.type}</td>
                          <td className="px-3 py-2">{m.type === "broadcast" ? "All" : (m.toName || m.toId)}</td>
                          <td className="px-3 py-2">{m.content}</td>
                          <td className="px-3 py-2 text-[#9E9E9E]">{new Date(m.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">
                            <span className="px-2 py-0.5 text-xs rounded border bg-emerald-600/15 text-emerald-300">{m.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {section === "settings" && (
              <div className="space-y-6">
                <SettingsPage />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
