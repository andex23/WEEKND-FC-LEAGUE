"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  const [proof, setProof] = useState<{ token_hash?: string; code?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [verified, setVerified] = useState(false)
  const [message, setMessage] = useState("")
  const [notificationPending, setNotificationPending] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get("token_hash")
    const code = params.get("code")
    if (token || code) setProof(token ? { token_hash: token } : { code: code! })
    else setMessage("Open the verification link from your email, or request a new link below.")
    // Keep the secret only in this component's memory, never localStorage.
    window.history.replaceState(null, "", window.location.pathname)
  }, [])
  async function verify() {
    if (!proof || busy) return
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(proof) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Could not verify your email. Please try again.")
      setVerified(Boolean(result.verified))
      setNotificationPending(Boolean(result.notificationPending))
      setProof(null)
      setMessage(result.message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not verify your email. Please try again.")
    } finally { setBusy(false) }
  }
  return (
    <div className="fc-recovery">
      <section className="relative z-10 w-full max-w-md rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6 text-center md:p-8">
        <h1 className="font-heading text-2xl text-white">{verified ? "Email verified" : "Verify your email"}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#A8A8A8]">
          {verified ? "You're one step closer to your first match." : "Press the button to confirm your email and submit your registration for admin review."}
        </p>
        {!verified && proof && <Button className="mt-6 w-full" disabled={busy} onClick={verify}>{busy ? "Verifying…" : "Verify email address"}</Button>}
        {message && <p className="mt-4 text-sm leading-relaxed text-[#A8A8A8]" role="status">{message}</p>}
        {verified && !notificationPending && <p className="mt-4 text-sm text-[#A8A8A8]">You'll receive a separate approval email before you can enter the dashboard.</p>}
        <Link href="/auth/check-email" className="mt-6 block text-sm text-emerald-400">{notificationPending ? "Retry the admin notification" : "Request a new verification email"}</Link>
        <Link href="/auth/login" className="mt-4 block text-sm text-[#A8A8A8]">Back to sign in</Link>
      </section>
    </div>
  )
}
