"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, usePathname } from "next/navigation"
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Filter as FilterIcon,
  LayoutDashboard,
  MessageSquare,
  Plus,
  RefreshCw,
  Search as SearchIcon,
  Send,
  Settings,
  ShieldCheck,
  type LucideIcon,
  Trophy,
  Users,
} from "lucide-react"
import { SettingsPage } from "@/components/admin/settings-page"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AdminOverlayNav } from "@/components/admin/overlay-nav"
import { toast } from "sonner"

// Route-backed nav items push a URL; in-page sections are tracked in local
// state and mirrored to the URL hash so they can be deep-linked.
const SECTION_ROUTES: Record<string, string> = {
  players: "/admin/players",
  fixtures: "/admin/fixtures",
  tournaments: "/admin/tournaments",
  stats: "/admin/stats",
  messaging: "/admin/messaging",
}
const HASH_SECTIONS = new Set(["overview", "registrations", "reports", "settings"])

const ADMIN_NAV = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "players", label: "Players", icon: Users },
  { key: "fixtures", label: "Fixtures", icon: CalendarDays },
  { key: "tournaments", label: "Tournaments", icon: Trophy },
  { key: "stats", label: "Stats", icon: BarChart3 },
  { key: "reports", label: "Reports", icon: ClipboardCheck },
  { key: "messaging", label: "Messaging", icon: MessageSquare },
  { key: "settings", label: "Settings", icon: Settings },
]

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
  const [entrySummary, setEntrySummary] = useState({ invited: 0, accepted: 0, declined: 0, total: 0 })
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Removed local storage; use Supabase only
  const activePlayersCount = useMemo(() => players.filter((p) => String(p.status) === "approved").length, [players])

  // Refresh data when page becomes visible (e.g., when returning from players page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && section === "overview") {
        fetchAllData()
      }
    }

    const handleFocus = () => {
      if (section === "overview") {
        fetchAllData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [section])

  useEffect(() => {
    fetchAllData()
  }, [])

  // Keep the visible section in sync with the URL hash so the mobile nav and
  // deep links can reach in-page sections like Reports and Settings.
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "")
      if (HASH_SECTIONS.has(hash)) setSection(hash as any)
    }
    applyHash()
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      // First get tournaments to find active tournament
      const tournamentsRes = await fetch("/api/admin/tournaments").catch(() => null)
      const tournamentsData = tournamentsRes ? await tournamentsRes.json() : null
      const tournaments = tournamentsData?.tournaments || []
      const activeTournament = tournaments.find((t: any) => t.status === "ACTIVE") || null
      
      // Build query string for tournament-specific data
      const tournamentQuery = activeTournament ? `?tournamentId=${encodeURIComponent(String(activeTournament.id))}` : ""
      
      const [playersRes, standingsRes, statusRes, settingsRes, entriesRes] = await Promise.all([
        fetch("/api/admin/players"),
        fetch(`/api/standings${tournamentQuery}`),
        fetch("/api/league/status"),
        fetch("/api/admin/settings").catch(() => null),
        fetch(activeTournament ? `/api/admin/tournament-entries?tournamentId=${encodeURIComponent(String(activeTournament.id))}` : "/api/admin/tournament-entries").catch(() => null),
      ])

      const playersData = await playersRes.json()
      const standingsData = await standingsRes.json()
      const statusData = await statusRes.json()
      const settingsData = settingsRes ? await settingsRes.json() : null
      const entriesData = entriesRes ? await entriesRes.json().catch(() => null) : null

      setPlayers(playersData.players || [])
      setStandings(standingsData.standings || [])
      setEntrySummary(entriesData?.summary || { invited: 0, accepted: 0, declined: 0, total: 0 })
      
      // Fetch fixtures specifically for active tournament
      let activeTournamentFixtures: any[] = []
      if (activeTournament) {
        try {
          const fixturesRes = await fetch(`/api/fixtures${tournamentQuery}`)
          const fixturesData = await fixturesRes.json()
          activeTournamentFixtures = fixturesData.fixtures || []
        } catch (e) {
          console.error("Error fetching tournament fixtures:", e)
        }
      }
      setFixtures(activeTournamentFixtures)
      setLeagueSettings({
        ...(statusData || {}), 
        name: settingsData?.branding?.league_name || activeTournament?.name || settingsData?.tournament?.name || "Weekend FC League",
        status: activeTournament?.status || settingsData?.tournament?.status || (statusData?.status || "DRAFT"),
        tournaments: tournaments.length,
        activeTournament
      })
      try {
        // Fetch player stats with tournament context
        const statsResScoped = await fetch(`/api/player-stats${tournamentQuery}`)
        const apiStats = await statsResScoped.json().catch(() => null)
        let mapped = apiStats || null as any
        const hasLeaders = Boolean(mapped?.topScorers?.length || mapped?.topAssists?.length || mapped?.discipline?.length)
        if (!hasLeaders) {
          // Fallback to admin stats leaders (edited on /admin/stats)
          const adminStats = await fetch("/api/admin/stats").then((r) => r.json()).catch(() => null)
          if (adminStats) {
            mapped = {
              topScorers: (adminStats?.leaders?.scorers || []).map((r: any, i: number) => ({ rank: i + 1, name: r.name, team: r.team, goals: r.G || r.goals || 0 })),
              topAssists: (adminStats?.leaders?.assists || []).map((r: any, i: number) => ({ rank: i + 1, name: r.name, team: r.team, assists: r.A || r.assists || 0 })),
              discipline: (adminStats?.leaders?.discipline || []).map((r: any) => ({ name: r.name, team: r.team, yellow_cards: r.YC || 0, red_cards: r.RC || 0 })),
            }
          }
        }
        // If still empty, compute from fixtures (activeTournamentFixtures)
        const stillEmpty = !mapped || (!mapped.topScorers?.length && !mapped.topAssists?.length && !mapped.discipline?.length)
        if (stillEmpty) {
          const goals = new Map<string, { name: string; team: string; goals: number }>()
          const mergedPlayers = [...players, ...standings.map((s: any) => ({ id: s.playerId, name: s.playerName, team: s.team }))]
          const byId = new Map(mergedPlayers.map((p: any) => [String(p.id || p.player_id || p.user_id || p.registration_id || p.name), p]))
          for (const fx of activeTournamentFixtures) {
            const played = String(fx.status || "").toUpperCase() === "PLAYED"
            if (!played) continue
            const hid = String(fx.homePlayer || fx.homeId)
            const aid = String(fx.awayPlayer || fx.awayId)
            const hName = fx.homeName || byId.get(hid)?.name || hid
            const aName = fx.awayName || byId.get(aid)?.name || aid
            const hTeam = fx.homeTeam || byId.get(hid)?.preferred_club || "-"
            const aTeam = fx.awayTeam || byId.get(aid)?.preferred_club || "-"
            const hGoals = Number(fx.homeScore ?? 0)
            const aGoals = Number(fx.awayScore ?? 0)
            if (!Number.isNaN(hGoals)) {
              const cur = goals.get(hid) || { name: hName, team: hTeam, goals: 0 }
              cur.name = hName; cur.team = hTeam; cur.goals += hGoals
              goals.set(hid, cur)
            }
            if (!Number.isNaN(aGoals)) {
              const cur = goals.get(aid) || { name: aName, team: aTeam, goals: 0 }
              cur.name = aName; cur.team = aTeam; cur.goals += aGoals
              goals.set(aid, cur)
            }
          }
          const computedScorers = Array.from(goals.values()).sort((a, b) => b.goals - a.goals).map((r, i) => ({ rank: i + 1, name: r.name, team: r.team, goals: r.goals }))
          mapped = { topScorers: computedScorers, topAssists: [], discipline: [] }
        }
        setPlayerStats(mapped)
      } catch {
        setPlayerStats(null)
      }

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
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(result?.error || "Failed to approve player")
        return
      }
      toast.success(result.emailSent ? "Player approved and confirmation email sent." : "Player approved.")
      fetchAllData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve player")
    }
  }

  const rejectPlayer = async (playerId: string) => {
    try {
      const response = await fetch("/api/admin/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action: "reject" }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(result?.error || "Failed to reject player")
        return
      }
      toast.success("Player rejected.")
      fetchAllData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject player")
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
      const res = await fetch("/api/admin/results/approve-all", { method: "POST" })
      if (!res.ok) throw new Error("fallback")
    } catch {
      setResultsQueue([])
    }
  }

  const clearAllData = async () => {
    setClearing(true)
    try {
      await fetch("/api/admin/clear", { method: "POST" })
      setSection("registrations" as any)
      await fetchAllData()
    } finally {
      setClearing(false)
    }
  }

  // demo seeding removed

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

  // Messaging persistence is in-memory only for now

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

  // Sidebar navigation: route-backed items push a URL; in-page sections
  // update local state and keep the URL hash in sync.
  const selectSection = (key: string) => {
    const route = SECTION_ROUTES[key]
    if (route) {
      router.push(route)
      return
    }
    setSection(key as any)
    window.history.replaceState(null, "", `/admin#${key}`)
  }

  const leagueActive = (leagueSettings?.status || "DRAFT").toUpperCase() === "ACTIVE" && leagueSettings?.activeTournament

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
          <Button onClick={fetchAllData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080A08] text-white">
      <div className="mx-auto flex w-full max-w-[1500px] gap-5 px-4 py-5 lg:px-6">
        <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-72 shrink-0 rounded-lg border border-[#243026] bg-[#0E120F] p-4 lg:block">
          <div className="mb-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8A9A8D]">Control room</div>
            <div className="mt-2 text-xl font-extrabold">Weekend FC</div>
            <div className="mt-1 text-xs text-[#8A9A8D]">League operations dashboard</div>
          </div>
          <nav className="space-y-1" aria-label="Admin sections">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon
              const isActive = section === item.key || ((item.key === "fixtures" || item.key === "tournaments") && (pathname || "").startsWith(`/admin/${item.key}`))
              const badge = item.key === "overview" ? activePlayersCount : item.key === "reports" ? matchesPendingApproval : item.key === "players" ? pendingRegistrations.length : null
              return (
                <button
                  key={item.key}
                  onClick={() => selectSection(item.key)}
                  className={`flex h-11 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors ${
                    isActive
                      ? "border-[#D6F66A] bg-[#D6F66A] text-[#10130D]"
                      : "border-transparent text-[#DDE8D8] hover:border-[#273529] hover:bg-[#151B16]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {badge !== null ? <span className="tabular-nums opacity-70">{badge}</span> : null}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-5">
          <header className="rounded-lg border border-[#243026] bg-[#0E120F] p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#A7B2A2]">
                  <StatusPill tone={leagueActive ? "green" : "amber"}>{leagueActive ? "Active tournament" : "Setup needed"}</StatusPill>
                  <span>{leagueSettings?.name || "Weekend FC League"}</span>
                </div>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-4xl">Admin operations</h1>
                <p className="mt-1 max-w-2xl text-sm text-[#A7B2A2]">
                  Review registrations, protect fixture quality, and keep the league moving from one dense workspace.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AdminOverlayNav />
                <Button variant="outline" onClick={fetchAllData} disabled={loading}>
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
                <Button variant="outline" className="border-rose-900/70 text-rose-300 hover:bg-rose-950/30" onClick={() => setConfirmClear(true)}>
                  <AlertTriangle className="h-4 w-4" /> Clear Data
                </Button>
              </div>
            </div>
          </header>

          {String(leagueSettings?.status || "").toUpperCase() === "COMPLETED" && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
              Tournament is completed. Editing fixtures and approving new results are disabled.
            </div>
          )}

          <section>
            {section === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
                  <MetricCard icon={Users} label="Active / total" value={`${activePlayersCount} / ${players.length}`} detail={`${pendingRegistrations.length} pending`} tone="green" />
                  <MetricCard icon={Trophy} label="Tournaments" value={leagueSettings?.tournaments || 0} detail={leagueSettings?.activeTournament?.name || "No active tournament"} tone="lime" />
                  <MetricCard icon={Send} label="Invites" value={`${entrySummary.accepted}/${entrySummary.total}`} detail={`${entrySummary.invited} waiting`} tone={entrySummary.invited ? "amber" : "green"} />
                  <MetricCard icon={CalendarDays} label="Fixtures" value={leagueSettings?.activeTournament ? fixtures.length : 0} detail="Created" tone="cyan" />
                  <MetricCard icon={CheckCircle2} label="Played" value={leagueSettings?.activeTournament ? matchesPlayed : 0} detail="Official matches" tone="green" />
                  <MetricCard icon={ClipboardCheck} label="Reports" value={matchesPendingApproval} detail="Need review" tone={matchesPendingApproval ? "amber" : "green"} />
                  <MetricCard icon={ShieldCheck} label="Status" value={leagueSettings?.activeTournament ? (leagueSettings?.status || "DRAFT") : "None"} detail="League state" tone={leagueActive ? "green" : "amber"} />
                </div>

                {pendingRegistrations.length > 0 && (
                  <Panel
                    title="Approval queue"
                    kicker={`${pendingRegistrations.length} waiting`}
                    action={
                      <Button size="sm" onClick={bulkApproveAll}>
                        <CheckCircle2 className="h-4 w-4" /> Approve all
                      </Button>
                    }
                  >
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {pendingRegistrations.slice(0, 6).map((p) => (
                        <div key={p.id} className="rounded-md border border-[#243026] bg-[#0B0E0C] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">{p.name}</div>
                              <div className="mt-1 truncate text-xs text-[#8A9A8D]">{p.email || "No email on file"}</div>
                            </div>
                            <StatusPill tone={p.email ? "amber" : "rose"}>{p.email ? "Pending" : "No email"}</StatusPill>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" className="h-8 flex-1" onClick={() => approvePlayer(p.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 flex-1" onClick={() => rejectPlayer(p.id)}>
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}

                {!leagueSettings?.activeTournament && (
                  <div className="rounded-lg border border-[#243026] bg-[#0E120F] p-5 text-center">
                    <div className="text-sm text-[#9E9E9E] mb-2">No Active Tournament</div>
                    <div className="text-xs text-[#9E9E9E]">All tournaments are currently inactive. Activate a tournament to see live data.</div>
                  </div>
                )}

                {leagueActive && fixtures.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Panel title="League table" kicker="Top 5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={fetchAllData} disabled={loading}>
                            {loading ? "Refreshing..." : "Refresh"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => router.push("/admin/stats")}>Open Stats</Button>
                        </div>
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
                      ) : players && players.length > 0 ? (
                        <div>
                          <div className="text-xs text-[#9E9E9E] mb-2">
                            {matchesPlayed === 0 
                              ? "Active Players (no matches played yet)" 
                              : "Active Players (standings calculated from played matches only)"}
                          </div>
                          <table className="w-full text-sm">
                            <thead className="text-[#9E9E9E]">
                              <tr>
                                <th className="text-left px-3 py-2">Player</th>
                                <th className="text-left px-3 py-2">Club</th>
                                <th className="text-right px-3 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {players.filter((p: any) => p.status === "approved").slice(0, 5).map((p: any) => (
                                <tr key={p.id} className="border-t border-[#1E1E1E]">
                                  <td className="px-3 py-2">{p.name}</td>
                                  <td className="px-3 py-2">{p.preferred_club || "-"}</td>
                                  <td className="px-3 py-2 text-right">
                                    <span className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded">
                                      {p.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-[#9E9E9E]">No players found.</div>
                      )}
                    </Panel>

                    <Panel title="Stats leaders" kicker="Current form" action={<Button variant="outline" size="sm" onClick={() => router.push("/admin/stats")}>Open Stats</Button>}>
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
                    </Panel>
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#243026] bg-[#0E120F] p-8 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">League Standings & Stats</div>
                      <div className="text-xs text-[#9E9E9E]">No league yet. Create one to see standings and leaders here.</div>
                    </div>
                    <Button onClick={goSetup}><Plus className="h-4 w-4 mr-2" /> Create League</Button>
                  </div>
                )}

                <div className="rounded-lg border border-[#243026] bg-[#0E120F] p-4 flex items-center justify-between">
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
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#8A9A8D]">Roster intake</div>
                    <h2 className="mt-1 text-2xl font-extrabold">Registrations</h2>
                    <p className="mt-1 text-sm text-[#A7B2A2]">Approve players only when their confirmation email can be sent.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled={selectedIds.size === 0} onClick={() => bulkAction("approve")}>
                      <CheckCircle2 className="h-4 w-4" /> Approve selected
                    </Button>
                    <Button variant="outline" disabled={selectedIds.size === 0} onClick={() => bulkAction("reject")}>
                      Reject selected
                    </Button>
                  </div>
                </div>

                {/* Manual add */}
                <ManualAdd onAdded={fetchAllData} />

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <MetricCard icon={Users} label="Total" value={players.length} detail="All registrations" tone="lime" />
                  <MetricCard icon={ShieldCheck} label="Approved" value={approvedPlayers.length} detail="Cleared to play" tone="green" />
                  <MetricCard icon={AlertTriangle} label="Pending" value={pendingRegistrations.length} detail="Need review" tone={pendingRegistrations.length ? "amber" : "green"} />
                  <MetricCard icon={AlertTriangle} label="Conflicts" value={conflictsCount} detail={`${rejectedCount} rejected`} tone={conflictsCount ? "rose" : "green"} />
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex w-full items-center gap-2 rounded-md border border-[#243026] bg-[#0E120F] px-3 py-2 sm:w-[360px]">
                    <SearchIcon className="h-4 w-4 text-[#9E9E9E]" />
                    <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Search" className="h-7 border-0 focus-visible:ring-0 p-0 bg-transparent" />
                  </div>
                  <Button variant="outline" className="h-9"> 
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" className="h-9" onClick={exportVisibleToCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[#243026] bg-[#0E120F]">
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
                            <StatusPill tone={(p.status || "pending").toLowerCase() === "approved" ? "green" : (p.status || "pending").toLowerCase() === "rejected" ? "rose" : "amber"}>
                              {p.status || "pending"}
                            </StatusPill>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex gap-2">
                              <Button size="sm" onClick={() => approvePlayer(p.id)} disabled={(p.status || "").toLowerCase() === "approved"}>Approve</Button>
                              <Button size="sm" variant="outline" onClick={() => rejectPlayer(p.id)} disabled={(p.status || "").toLowerCase() === "rejected"}>Reject</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-[#9E9E9E]">Rows per page: {rowsPerPage}</div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-[#151B16] rounded" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: pageCount }).slice(0, 5).map((_, i) => {
                      const num = i + 1
                      return (
                        <button key={num} onClick={() => setPage(num)} className={`h-8 w-8 rounded ${currentPage === num ? "bg-emerald-500 text-black" : "hover:bg-[#151B16]"}`}>
                          {num}
                        </button>
                      )
                    })}
                    <button className="p-2 hover:bg-[#151B16] rounded" disabled={currentPage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {section === "reports" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#8A9A8D]">Match control</div>
                    <h2 className="mt-1 text-2xl font-extrabold">Result reports</h2>
                    <p className="mt-1 text-sm text-[#A7B2A2]">Review pending score reports before they become official.</p>
                  </div>
                  <Button disabled={selectedReportIds.size === 0 || String(leagueSettings?.status || "").toUpperCase() === "COMPLETED"} onClick={bulkApproveReports}>
                    <CheckCircle2 className="h-4 w-4" /> Approve selected
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <MetricCard icon={ClipboardCheck} label="Total reports" value={resultsQueue.length} detail="In queue" tone="lime" />
                  <MetricCard icon={AlertTriangle} label="Pending" value={matchesPendingApproval} detail="Need admin review" tone={matchesPendingApproval ? "amber" : "green"} />
                  <MetricCard icon={CalendarDays} label="Recent" value={recentReports7d} detail="Last 7 days" tone="cyan" />
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex w-full items-center gap-2 rounded-md border border-[#243026] bg-[#0E120F] px-3 py-2 sm:w-[360px]">
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

                <div className="overflow-x-auto rounded-lg border border-[#243026] bg-[#0E120F]">
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
                              <Button size="sm" className="" onClick={async () => { await approveReport(r.id) }} disabled={String(leagueSettings?.status || "").toUpperCase() === "COMPLETED"}>Approve</Button>
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
                    <button className="p-2 hover:bg-[#151B16] rounded" disabled={reportsCurrentPage <= 1} onClick={() => setReportPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: reportsPageCount }).slice(0, 5).map((_, i) => {
                      const num = i + 1
                      return (
                        <button key={num} onClick={() => setReportPage(num)} className={`h-8 w-8 rounded ${reportsCurrentPage === num ? "bg-emerald-500 text-black" : "hover:bg-[#151B16]"}`}>
                          {num}
                        </button>
                      )
                    })}
                    <button className="p-2 hover:bg-[#151B16] rounded" disabled={reportsCurrentPage >= reportsPageCount} onClick={() => setReportPage((p) => Math.min(reportsPageCount, p + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {section === "stats" && null}

            {section === "messaging" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#8A9A8D]">Comms desk</div>
                    <h2 className="mt-1 text-2xl font-extrabold">Messaging</h2>
                    <p className="mt-1 text-sm text-[#A7B2A2]">Send league-wide updates and direct player notices from one queue.</p>
                  </div>
                  <Button variant="outline" className="h-9" onClick={clearMessages}>Clear History</Button>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex w-full items-center gap-2 rounded-md border border-[#243026] bg-[#0E120F] px-3 py-2 sm:w-[360px]">
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
                </div>

                <Panel
                  title="Global broadcast"
                  kicker="All players"
                  action={
                    <Button className="bg-[#D6F66A] text-[#10130D] hover:bg-[#E9FF9A]" onClick={sendBroadcast}>
                      <Send className="h-4 w-4" /> Send Broadcast
                    </Button>
                  }
                >
                  <Label className="text-sm text-[#DDE8D8]">Announcement</Label>
                  <Input value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} placeholder="Write a league-wide announcement" className="mt-2 border-[#243026] bg-[#080A08]" />
                </Panel>

                <Panel
                  title="Direct message"
                  kicker="One player"
                  action={
                    <Button className="bg-[#D6F66A] text-[#10130D] hover:bg-[#E9FF9A]" onClick={sendDirect}>
                      <Send className="h-4 w-4" /> Send Message
                    </Button>
                  }
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm text-[#DDE8D8]">Player</Label>
                      <Select value={directPlayerId} onValueChange={(v) => setDirectPlayerId(v)}>
                        <SelectTrigger className="mt-2 border-[#243026] bg-[#080A08]">
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
                      <Label className="text-sm text-[#DDE8D8]">Message</Label>
                      <Input value={directText} onChange={(e) => setDirectText(e.target.value)} placeholder="Direct message for disputes or clarifications" className="mt-2 border-[#243026] bg-[#080A08]" />
                    </div>
                  </div>
                </Panel>

                <div className="overflow-x-auto rounded-lg border border-[#243026] bg-[#0E120F]">
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
                            <StatusPill tone="green">{m.status}</StatusPill>
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
        </main>
      </div>
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="sm:max-w-md border-[#243026] bg-[#0E120F] text-white">
          <DialogHeader>
            <DialogTitle>Clear league data?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancel</Button>
            <Button variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20" onClick={clearAllData}>Clear</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type Tone = "green" | "amber" | "rose" | "lime" | "cyan"

const toneClasses: Record<Tone, { pill: string; metric: string; icon: string }> = {
  green: {
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    metric: "border-emerald-500/20 bg-emerald-500/[0.06]",
    icon: "text-emerald-300",
  },
  amber: {
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    metric: "border-amber-500/20 bg-amber-500/[0.06]",
    icon: "text-amber-300",
  },
  rose: {
    pill: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    metric: "border-rose-500/20 bg-rose-500/[0.06]",
    icon: "text-rose-300",
  },
  lime: {
    pill: "border-[#D6F66A]/30 bg-[#D6F66A]/10 text-[#E9FF9A]",
    metric: "border-[#D6F66A]/20 bg-[#D6F66A]/[0.06]",
    icon: "text-[#D6F66A]",
  },
  cyan: {
    pill: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
    metric: "border-cyan-400/20 bg-cyan-400/[0.06]",
    icon: "text-cyan-200",
  },
}

function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-bold uppercase tracking-[0.12em] ${toneClasses[tone].pill}`}>
      {children}
    </span>
  )
}

function MetricCard({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: string | number; detail: string; tone: Tone }) {
  return (
    <div className={`min-h-[116px] rounded-lg border p-4 ${toneClasses[tone].metric}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A9A8D]">{label}</div>
        <Icon className={`h-4 w-4 ${toneClasses[tone].icon}`} />
      </div>
      <div className="mt-5 truncate text-2xl font-extrabold tabular-nums text-white">{value}</div>
      <div className="mt-1 truncate text-xs text-[#A7B2A2]">{detail}</div>
    </div>
  )
}

function Panel({ title, kicker, action, children }: { title: string; kicker?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#243026] bg-[#0E120F] p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {kicker ? <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A9A8D]">{kicker}</div> : null}
          <h3 className="mt-1 text-base font-bold text-white">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function ManualAdd({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("")
  const [gamerTag, setGamerTag] = useState("")
  const [consoleType, setConsoleType] = useState("PS5")
  const [club, setClub] = useState("")
  const [location, setLocation] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    setLoading(true)
    try {
      const response = await fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add", name, username: gamerTag || null, psn_name: gamerTag || null, console: consoleType, preferred_club: club, location, status: "pending" }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.success) {
        throw new Error(result?.error || "Failed to add player")
      }
      setName(""); setClub(""); setGamerTag(""); setLocation("")
      toast.success("Player added as pending")
      onAdded()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add player")
    } finally { setLoading(false) }
  }

  const importCsv = async (file: File) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length === 0) return
    const header = lines[0].split(",").map((h) => h.replaceAll('"','').trim().toLowerCase())
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.replaceAll('"','').trim())
      const obj: any = {}
      header.forEach((h, i) => { obj[h] = cols[i] })
      return obj
    })
    const rowsWithNames = rows.filter((row) => String(row.name || "").trim())
    const results = await Promise.allSettled(rowsWithNames.map(async (row) => {
      const rawStatus = String(row.status || "pending").toLowerCase()
      const status = rawStatus === "active" ? "approved" : ["approved", "pending", "rejected"].includes(rawStatus) ? rawStatus : "pending"
      const response = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          name: row.name,
          username: row.gamer_tag || row.gamertag || null,
          psn_name: row.gamer_tag || row.gamertag || null,
          console: row.console || "PS5",
          preferred_club: row.preferred_club || null,
          location: row.location || null,
          status,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.success) throw new Error(result?.error || "Import row failed")
      return result
    }))
    const failed = results.filter((result) => result.status === "rejected").length
    if (failed) {
      toast.error(`Imported with ${failed} failed rows`)
    } else {
      toast.success(`Imported ${rowsWithNames.length} players`)
    }
    onAdded()
  }

  return (
    <div className="rounded-lg border border-[#243026] bg-[#0E120F] p-4">
      <div className="mb-4">
        <div className="text-sm font-semibold">Add Player Manually</div>
        <div className="mt-1 text-xs text-[#8A9A8D]">Manual players start pending and can be approved from the roster.</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div>
          <Label className="text-sm">Name</Label>
          <Input className="mt-1 border-[#243026] bg-[#080A08]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" />
        </div>
        <div>
          <Label className="text-sm">Gamer Tag</Label>
          <Input className="mt-1 border-[#243026] bg-[#080A08]" value={gamerTag} onChange={(e) => setGamerTag(e.target.value)} placeholder="PSN / Xbox handle" />
        </div>
        <div>
          <Label className="text-sm">Console</Label>
          <Select value={consoleType} onValueChange={setConsoleType}>
            <SelectTrigger className="mt-1 border-[#243026] bg-[#080A08]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PS5">PS5</SelectItem>
              <SelectItem value="XBOX">Xbox</SelectItem>
              <SelectItem value="PC">PC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Preferred Club</Label>
          <Input className="mt-1 border-[#243026] bg-[#080A08]" value={club} onChange={(e) => setClub(e.target.value)} placeholder="Arsenal" />
        </div>
        <div>
          <Label className="text-sm">Location</Label>
          <Input className="mt-1 border-[#243026] bg-[#080A08]" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
        </div>
        <div className="flex justify-end">
          <Button className="bg-[#D6F66A] text-[#10130D] hover:bg-[#E9FF9A]" onClick={submit} disabled={loading}>{loading ? "Adding…" : "Add"}</Button>
        </div>
      </div>

      <div className="mt-4 text-xs text-[#9E9E9E]">Or import CSV (headers: name,gamer_tag,console,preferred_club,location,status)</div>
      <div className="mt-2">
        <input type="file" accept=".csv" onChange={async (e) => { const f = e.currentTarget.files?.[0]; if (f) await importCsv(f); e.currentTarget.value = "" }} />
      </div>
    </div>
  )
}
