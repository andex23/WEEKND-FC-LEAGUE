"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Row { id: string; name: string; team: string; [k: string]: any }

export function StandingsTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [onlyOverridden, setOnlyOverridden] = useState(false)
  const [reason, setReason] = useState("")
  const [data, setData] = useState<{ standings: Row[]; leaders: { scorers: Row[]; assists: Row[]; discipline: Row[] } }>({ standings: [], leaders: { scorers: [], assists: [], discipline: [] } })

  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [pages, setPages] = useState<{ standings: number; scorers: number; assists: number; discipline: number }>({ standings: 1, scorers: 1, assists: 1, discipline: 1 })
  const [activeTab, setActiveTab] = useState<"table" | "scorers" | "assists" | "discipline">("table")

  const [newName, setNewName] = useState("")
  const [newTeam, setNewTeam] = useState("")
  const [registrations, setRegistrations] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement | null>(null)

  const setPage = (key: keyof typeof pages, value: number) => setPages((p) => ({ ...p, [key]: value }))

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [statsRes, regsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/registrations"),
      ])
      if (!statsRes.ok) throw new Error("Failed to load stats")
      const stats = await statsRes.json()
      setData(stats)
      setRegistrations((await regsRes.json()).registrations || [])
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = (rows: Row[], cols: string[]) => {
    let r = rows
    if (search.trim()) {
      const s = search.toLowerCase()
      r = r.filter((x) => x.name.toLowerCase().includes(s) || x.team.toLowerCase().includes(s))
    }
    if (onlyOverridden) r = r.filter((x) => Object.values(x.overridden || {}).some(Boolean))
    return r.map((x) => ({ ...x, _cols: cols }))
  }

  const overrideCell = async (table: string, id: string, field: string, value: string) => {
    const payload: any = { action: "override", table, id, field, value, reason }
    const res = await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (res.ok) fetchAll()
  }

  const recompute = async () => { await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "recompute" }) }); fetchAll() }
  const resetOverrides = async () => { await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset_overrides" }) }); fetchAll() }
  const resetRow = async (table: string, id: string) => { await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset_row", table, id }) }); fetchAll() }
  const exportCsv = async (table: "standings" | "scorers" | "assists" | "discipline" = "standings") => { const res = await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "export", table }) }); const txt = await res.text(); const url = URL.createObjectURL(new Blob([txt],{type:"text/csv"})); const a=document.createElement("a"); a.href=url;a.download=`${table}.csv`;a.click();URL.revokeObjectURL(url) }

  const addRow = async () => {
    const table = activeTab === "table" ? "standings" : activeTab
    if (!newName.trim()) return
    await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_row", table, name: newName.trim(), team: newTeam.trim() }) })
    setNewName("")
    setNewTeam("")
    fetchAll()
  }

  const deleteRow = async (table: string, id: string) => {
    await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_row", table, id }) })
    fetchAll()
  }

  const updateMeta = async (table: string, id: string, field: "name" | "team", value: string) => {
    await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_meta", table, id, [field]: value }) })
    fetchAll()
  }

  const onPickRegistration = (id: string) => {
    const p = registrations.find((r) => String(r.id) === String(id))
    if (!p) return
    setNewName(p.name || "")
    setNewTeam(p.assignedTeam || p.preferred_team || p.preferred_club || "")
  }

  const onImportCsv = async (file: File) => {
    const txt = await file.text()
    const lines = txt.split(/\r?\n/).filter(Boolean)
    if (lines.length === 0) return
    const table = activeTab === "table" ? "standings" : activeTab
    for (const line of lines) {
      const [name, team] = line.split(",")
      if (!name) continue
      // eslint-disable-next-line no-await-in-loop
      await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_row", table, name: name.trim(), team: (team || "").trim() }) })
    }
    fetchAll()
  }

  const Table = ({ rows, table, pageKey }: { rows: Row[]; table: string; pageKey: keyof typeof pages }) => {
    const page = pages[pageKey]
    const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage))
    const currentPage = Math.min(page, pageCount)
    const start = (currentPage - 1) * rowsPerPage
    const pageRows = rows.slice(start, start + rowsPerPage)

    const colClass = (col: string) => {
      if (table !== "standings") return ""
      if (["GF","GA","GD"].includes(col)) return "hidden lg:table-cell"
      if (["P","W","D","L"].includes(col)) return "hidden md:table-cell"
      // Pts is always visible
      return ""
    }

    return (
      <div className="space-y-3">
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 w-48">Player</th>
                <th className="text-left px-3 py-2 w-40">Team</th>
                {pageRows[0]?._cols?.map((c) => (
                  <th key={c} className={`text-right px-3 py-2 ${colClass(c)}`}>{c}</th>
                ))}
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 min-w-[12rem]">
                    <Input className="w-full sm:w-48" defaultValue={r.name} onBlur={(e) => { const v = e.currentTarget.value.trim(); if (v && v !== r.name) updateMeta(table, r.id, "name", v) }} />
                  </td>
                  <td className="px-3 py-2 min-w-[9rem]">
                    <Input className="w-full sm:w-40" defaultValue={r.team} onBlur={(e) => { const v = e.currentTarget.value.trim(); if (v !== r.team) updateMeta(table, r.id, "team", v) }} />
                  </td>
                  {r._cols?.map((c) => (
                    <td key={c} className={`px-3 py-2 text-right tabular-nums ${colClass(c)}`}>
                      <div className="flex items-center justify-end gap-2">
                        <Input defaultValue={r[c] ?? 0} type="number" className="w-12 sm:w-14 text-right" onBlur={(e) => { const val = e.currentTarget.value; if (Number(val) < 0) { e.currentTarget.value = String(r[c] ?? 0); return } overrideCell(table, r.id, c, val) }} />
                        {r.overridden?.[c] && <span className="px-2 py-0.5 rounded text-xs border bg-yellow-50 border-yellow-200 text-yellow-800">overridden</span>}
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => resetRow(table, r.id)}>Reset</Button>
                      <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50" onClick={() => deleteRow(table, r.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <Input placeholder="Player name" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-48" />
            <Input placeholder="Team" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} className="w-40" />
            <Select onValueChange={(v) => onPickRegistration(v)}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Pick from registrations (optional)" /></SelectTrigger>
              <SelectContent>
                {registrations.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}{p.preferred_team ? ` · ${p.preferred_team}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={addRow}>Add</Button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) onImportCsv(f); e.currentTarget.value = "" }} />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>Import CSV</Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-gray-600">Page {currentPage} of {pageCount}</div>
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(pageKey, Math.max(1, currentPage - 1))}>Prev</Button>
            {Array.from({ length: Math.min(pageCount, 5) }).map((_, i) => {
              const num = i + 1
              return (
                <button key={num} onClick={() => setPage(pageKey, num)} className={`h-8 w-8 rounded ${currentPage === num ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}>{num}</button>
              )
            })}
            <Button variant="outline" size="sm" disabled={currentPage >= pageCount} onClick={() => setPage(pageKey, Math.min(pageCount, currentPage + 1))}>Next</Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div className="p-8 text-center text-gray-600">Loading stats…</div>
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>

  const standingsCols = ["P","W","D","L","GF","GA","GD","Pts"]
  const scorersCols = ["G"]
  const assistsCols = ["A"]
  const disciplineCols = ["YC","RC"]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle>Stats Command Center</CardTitle>
            <div className="flex items-center gap-2">
              <Input placeholder="Override reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} className="w-64" />
              <Select defaultValue={String(rowsPerPage)} onValueChange={(v) => { const n = Number(v) || 10; setRowsPerPage(n); setPages({ standings: 1, scorers: 1, assists: 1, discipline: 1 }) }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Rows per page" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Rows: 10</SelectItem>
                  <SelectItem value="25">Rows: 25</SelectItem>
                  <SelectItem value="50">Rows: 50</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={recompute}>Recompute</Button>
              <Button variant="outline" onClick={() => exportCsv(activeTab === "table" ? "standings" : activeTab)}>Export CSV</Button>
              <Button variant="outline" onClick={resetOverrides}>Reset All Overrides</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input placeholder="Search player/team" value={search} onChange={(e) => setSearch(e.target.value)} className="w-60" />
            <label className="text-sm text-gray-600 flex items-center gap-2">
              <input type="checkbox" checked={onlyOverridden} onChange={(e) => setOnlyOverridden(e.target.checked)} /> Show only overridden
            </label>
          </div>

          <Tabs defaultValue="table" onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="table">League Table</TabsTrigger>
              <TabsTrigger value="scorers">Top Scorers</TabsTrigger>
              <TabsTrigger value="assists">Top Assists</TabsTrigger>
              <TabsTrigger value="discipline">Discipline</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-4">
              <Table rows={filtered(data.standings, standingsCols)} table="standings" pageKey="standings" />
            </TabsContent>
            <TabsContent value="scorers" className="mt-4">
              <Table rows={filtered(data.leaders.scorers, scorersCols)} table="scorers" pageKey="scorers" />
            </TabsContent>
            <TabsContent value="assists" className="mt-4">
              <Table rows={filtered(data.leaders.assists, assistsCols)} table="assists" pageKey="assists" />
            </TabsContent>
            <TabsContent value="discipline" className="mt-4">
              <Table rows={filtered(data.leaders.discipline, disciplineCols)} table="discipline" pageKey="discipline" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
