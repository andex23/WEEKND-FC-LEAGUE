"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function TournamentSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [t, setT] = useState<any | null>(null)

  useEffect(() => {
    ;(async () => {
      const r = await fetch("/api/admin/tournaments").then((x) => x.json())
      const found = (r.tournaments || []).find((x: any) => String(x.id) === String(id))
      setT(found || null)
    })()
  }, [id])

  const save = async () => {
    if (!t) return
    await fetch("/api/admin/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", id: t.id, patch: { name: t.name, season: t.season, type: t.type, status: t.status } }) })
    toast.success("Saved")
  }
  const activate = async () => {
    if (!t) return
    await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "tournament", data: { name: t.name, status: "ACTIVE", active_tournament_id: t.id, season: t.season, format: t.type } }) })
    toast.success("Activated")
  }
  const deactivate = async () => {
    if (!t) return
    await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "tournament", data: { status: "INACTIVE", active_tournament_id: null } }) })
    toast.success("Deactivated")
  }

  const generate = async () => {
    if (!t) return
    const rounds = String(t.type || "DOUBLE").toUpperCase() === "SINGLE" ? 1 : 2
    const res = await fetch("/api/admin/generate-fixtures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rounds, tournamentId: t.id, season: t.season }) })
    if (!res.ok) { toast.error("Failed to generate fixtures"); return }
    toast.success("Fixtures generated")
  }

  const clearFixtures = async () => {
    if (!t) return
    await fetch("/api/fixtures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear_for_tournament", tournamentId: t.id }) })
    toast.success("Cleared fixtures")
  }

  if (!t) return (
    <div className="min-h-screen bg-[#0D0D0D] text-white"><div className="container-5xl section-pad"><Button variant="outline" onClick={() => router.push("/admin/tournaments")}>← Back</Button><div className="mt-6 text-sm text-[#9E9E9E]">Tournament not found.</div></div></div>
  )

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad space-y-6">
        <Button variant="outline" onClick={() => router.push("/admin/tournaments")}>← Back</Button>
        <div className="rounded-2xl border p-4 bg-[#141414] space-y-3">
          <div className="text-sm font-semibold">Basics</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Name</label>
              <Input className="mt-1 bg-transparent" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Season</label>
              <Input className="mt-1 bg-transparent" value={t.season} onChange={(e) => setT({ ...t, season: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Status</label>
              <Select value={t.status} onValueChange={(v) => setT({ ...t, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Format</label>
              <Select value={t.type} onValueChange={(v) => setT({ ...t, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single Round Robin</SelectItem>
                  <SelectItem value="DOUBLE">Double Round Robin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={save}>Save</Button>
            <Button onClick={activate}>Activate</Button>
            <Button variant="outline" onClick={deactivate}>Deactivate</Button>
          </div>
        </div>

        <div className="rounded-2xl border p-4 bg-[#141414] space-y-3">
          <div className="text-sm font-semibold">Actions</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={generate}>Generate Fixtures</Button>
            <Button variant="outline" onClick={clearFixtures}>Clear Fixtures</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
