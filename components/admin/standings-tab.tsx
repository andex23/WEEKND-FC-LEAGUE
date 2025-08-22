"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Row { id: string; name: string; team: string; [k: string]: any }

export function StandingsTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [onlyOverridden, setOnlyOverridden] = useState(false)
  const [reason, setReason] = useState("")
  const [data, setData] = useState<{ standings: Row[]; leaders: { scorers: Row[]; assists: Row[]; discipline: Row[] } }>({ standings: [], leaders: { scorers: [], assists: [], discipline: [] } })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/stats")
      if (!res.ok) throw new Error("Failed to load stats")
      setData(await res.json())
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
  const exportCsv = async () => { const res = await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "export" }) }); const txt = await res.text(); const url = URL.createObjectURL(new Blob([txt],{type:"text/csv"})); const a=document.createElement("a"); a.href=url;a.download="league-table.csv";a.click();URL.revokeObjectURL(url) }

  const Table = ({ rows, table }: { rows: Row[]; table: string }) => (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2">Player</th>
            <th className="text-left px-3 py-2">Team</th>
            {rows[0]?._cols?.map((c) => (
              <th key={c} className="text-right px-3 py-2">{c}</th>
            ))}
            <th className="text-right px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">{r.name}</td>
              <td className="px-3 py-2">{r.team}</td>
              {r._cols?.map((c) => (
                <td key={c} className="px-3 py-2 text-right tabular-nums">
                  <div className="flex items-center justify-end gap-2">
                    <Input defaultValue={r[c] ?? 0} type="number" className="w-20 text-right" onBlur={(e) => { const val = e.currentTarget.value; if (Number(val) < 0) { e.currentTarget.value = String(r[c] ?? 0); return } overrideCell(table, r.id, c, val) }} />
                    {r.overridden?.[c] && <span className="px-2 py-0.5 rounded text-xs border bg-yellow-50 border-yellow-200 text-yellow-800">overridden</span>}
                  </div>
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                <Button size="sm" variant="outline" onClick={() => resetRow(table, r.id)}>Reset</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

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
              <Button onClick={recompute}>Recompute</Button>
              <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
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

          <Tabs defaultValue="table">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="table">League Table</TabsTrigger>
              <TabsTrigger value="scorers">Top Scorers</TabsTrigger>
              <TabsTrigger value="assists">Top Assists</TabsTrigger>
              <TabsTrigger value="discipline">Discipline</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-4">
              <Table rows={filtered(data.standings, standingsCols)} table="standings" />
            </TabsContent>
            <TabsContent value="scorers" className="mt-4">
              <Table rows={filtered(data.leaders.scorers, scorersCols)} table="scorers" />
            </TabsContent>
            <TabsContent value="assists" className="mt-4">
              <Table rows={filtered(data.leaders.assists, assistsCols)} table="assists" />
            </TabsContent>
            <TabsContent value="discipline" className="mt-4">
              <Table rows={filtered(data.leaders.discipline, disciplineCols)} table="discipline" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
