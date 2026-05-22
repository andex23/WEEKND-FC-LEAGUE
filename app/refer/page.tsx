"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Mail, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner } from "@/components/ui/error-banner"

const labelClass = "text-[11px] font-bold uppercase tracking-[0.16em] text-[#9E9E9E]"

export default function ReferPage() {
  const [email, setEmail] = useState("")
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/referral/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, note }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result?.error || "Couldn't send the invite.")
      toast.success(`Invite sent to ${email}.`)
      setEmail("")
      setNote("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the invite.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-12 text-white">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6 md:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-heading text-2xl">Invite a friend</h1>
            <p className="mt-1 text-sm text-[#8A8A8A]">
              Send a branded invite to register for the Weekend FC League.
            </p>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {error ? <ErrorBanner title="Couldn't send invite" message={error} /> : null}

            <div className="space-y-1.5">
              <label htmlFor="email" className={labelClass}>
                Friend&apos;s email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5C5C]" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="h-11 rounded-lg border-[#2A2A2A] bg-[#0F0F0F] pl-10 text-white placeholder:text-[#5C5C5C] focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="note" className={labelClass}>
                Personal note <span className="text-[#5C5C5C]">(optional)</span>
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                placeholder="Come join our weekend league!"
                className="h-24 w-full rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-3 text-sm text-white placeholder:text-[#5C5C5C] focus-visible:border-emerald-500 focus-visible:outline-none"
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="h-12 w-full font-heading text-black"
              style={{ background: "linear-gradient(90deg,#f5c54a,#10b981)" }}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                "Send invite"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
