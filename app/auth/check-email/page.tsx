"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CheckEmailPage() {
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  async function resend(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Could not resend verification. Please try again.")
      setMessage(result.message)
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not resend verification. Please try again.") }
    finally { setBusy(false) }
  }
  return (
    <div className="fc-recovery">
      <section className="relative z-10 w-full max-w-md rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6 md:p-8">
        <h1 className="text-center font-heading text-2xl text-white">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#A8A8A8]">First verify your email address using the link we send you. An admin will then review your registration. We'll email you when you're approved and can sign in to the dashboard.</p>
        <p className="mt-3 text-sm leading-relaxed text-[#A8A8A8]">No email? Check spam, then request a fresh link below. If you're already verified, this also retries a delayed admin notification.</p>
        <form onSubmit={resend} className="mt-6 space-y-3">
          <label htmlFor="verification-email" className="block text-sm text-white">Registration email</label>
          <Input id="verification-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Resend verification"}</Button>
        </form>
        {message && <p role="status" className="mt-4 text-sm leading-relaxed text-[#A8A8A8]">{message}</p>}
        <Link href="/auth/login" className="mt-6 block text-center text-sm text-emerald-400">Back to sign in</Link>
      </section>
    </div>
  )
}
