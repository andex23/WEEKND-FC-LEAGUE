"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Megaphone, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminOverlayNav } from "@/components/admin/overlay-nav"

export default function AdminMessagingPage() {
  const router = useRouter()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false)
  const [sendingFixtures, setSendingFixtures] = useState(false)

  const sendAnnouncement = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Add a subject and a message first.")
      return
    }
    setSendingAnnouncement(true)
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result?.error || "Failed to send announcement")
      toast.success(`Announcement sent to ${result.sent} player${result.sent === 1 ? "" : "s"}.`)
      setSubject("")
      setMessage("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send announcement")
    } finally {
      setSendingAnnouncement(false)
    }
  }

  const emailFixtures = async () => {
    setSendingFixtures(true)
    try {
      const res = await fetch("/api/admin/notify-fixtures", { method: "POST" })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result?.error || "Failed to email fixtures")
      toast.success(`Fixtures emailed to ${result.sent} player${result.sent === 1 ? "" : "s"}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to email fixtures")
    } finally {
      setSendingFixtures(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad px-4 md:px-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button onClick={() => router.push("/admin")}>← Back to Admin</Button>
          <AdminOverlayNav />
        </div>

        <header className="mb-6">
          <h1 className="text-xl font-extrabold">Messaging</h1>
          <p className="text-sm text-[#9E9E9E]">Email announcements and fixtures to your players.</p>
        </header>

        <div className="space-y-6">
          {/* Announcement */}
          <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-emerald-400" />
              <h2 className="font-semibold">Send an announcement</h2>
            </div>
            <p className="mb-4 text-xs text-[#9E9E9E]">
              Emails every approved player and posts an in-app notification.
            </p>
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Subject</Label>
                <Input
                  className="mt-1 bg-transparent"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Matchday 3 is live"
                  maxLength={120}
                />
              </div>
              <div>
                <Label className="text-sm">Message</Label>
                <textarea
                  className="mt-1 h-40 w-full rounded-md border border-[#2A2A2A] bg-transparent p-3 text-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your announcement. Blank lines start a new paragraph."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={sendAnnouncement} disabled={sendingAnnouncement}>
                {sendingAnnouncement ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send to all players"
                )}
              </Button>
            </div>
          </div>

          {/* Fixtures */}
          <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-400" />
              <h2 className="font-semibold">Email fixtures</h2>
            </div>
            <p className="mb-4 text-xs text-[#9E9E9E]">
              Sends each approved player their own list of scheduled fixtures.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={emailFixtures} disabled={sendingFixtures}>
                {sendingFixtures ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Email everyone their fixtures"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
