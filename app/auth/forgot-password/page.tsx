"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Mail } from "lucide-react"
import { ErrorBanner } from "@/components/ui/error-banner"
import { BackgroundVideo } from "@/components/background-video"

const labelClass = "text-[11px] font-bold uppercase tracking-[0.16em] text-[#9E9E9E]"
const inputClass =
  "h-11 rounded-lg border-[#2A2A2A] bg-[#0F0F0F] pl-10 text-white placeholder:text-[#5C5C5C] focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result?.error || "Could not send the reset email.")
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 py-12">
      <BackgroundVideo />

      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6 md:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 font-heading text-xl text-black">
            W
          </div>
          <h1 className="mt-4 font-heading text-2xl text-white">Reset your password</h1>
          <p className="mt-1 text-sm text-[#8A8A8A]">
            Enter your email and we&apos;ll send you a link to set a new password.
          </p>
        </div>

        <div className="mt-6">
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm leading-6 text-[#B0B0B0]">
                If an account exists for <span className="font-medium">{email}</span>, a reset
                link is on its way. Check your inbox.
              </p>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-emerald-400 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <ErrorBanner title="Couldn't send reset link" message={error} />}
              <div className="space-y-1.5">
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5C5C]" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="h-12 w-full font-heading text-black"
                style={{ background: "linear-gradient(90deg,#f5c54a,#10b981)" }}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              <div className="text-center text-sm text-[#7A7A7A]">
                <Link href="/auth/login" className="font-medium text-emerald-400 hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
