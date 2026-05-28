"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, Loader2, Lock } from "lucide-react"
import { ErrorBanner } from "@/components/ui/error-banner"
import { BackgroundVideo } from "@/components/background-video"

const labelClass = "text-[11px] font-bold uppercase tracking-[0.16em] text-[#9E9E9E]"
const inputClass =
  "h-11 rounded-lg border-[#2A2A2A] bg-[#0F0F0F] pl-10 text-white placeholder:text-[#5C5C5C] focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function prepareRecoverySession() {
      const supabase = createClient()
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")
      const tokenHash = params.get("token_hash")
      const type = params.get("type")

      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        })
        if (error && !cancelled) {
          setError("This reset link is invalid or expired. Request a new password reset link.")
        } else if (!error) {
          window.history.replaceState(null, "", window.location.pathname)
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error && !cancelled) {
          setError("This reset link is invalid or expired. Request a new password reset link.")
        } else if (!error) {
          window.history.replaceState(null, "", window.location.pathname)
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!cancelled) {
        setHasRecoverySession(Boolean(session))
        if (!session && !code && !tokenHash) {
          setError("Open the password reset link from your email, or request a new link.")
        }
        setCheckingSession(false)
      }
    }

    prepareRecoverySession()

    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!hasRecoverySession) {
      setError("Open the password reset link from your email, or request a new link.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      // Fire off the "password changed" security alert; never block on it.
      await fetch("/api/account/password-changed", { method: "POST" }).catch(() => {})
      toast.success("Password updated. You can sign in now.")
      router.push("/auth/login")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update your password. The reset link may have expired.",
      )
    } finally {
      setSaving(false)
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-black">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-heading text-2xl text-white">Set a new password</h1>
          <p className="mt-1 text-sm text-[#8A8A8A]">Choose a new password for your account.</p>
        </div>

        <div className="mt-6">
          {checkingSession ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-[#1E1E1E] bg-[#0F0F0F] px-4 py-5 text-sm text-[#B0B0B0]">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              Checking reset link...
            </div>
          ) : !hasRecoverySession ? (
            <div className="space-y-4 text-center">
              {error && <ErrorBanner title="Reset link needed" message={error} />}
              <Button
                asChild
                className="h-12 w-full font-heading text-black"
                style={{ background: "linear-gradient(90deg,#f5c54a,#10b981)" }}
              >
                <Link href="/auth/forgot-password">Request a new link</Link>
              </Button>
              <Link href="/auth/login" className="text-sm font-medium text-emerald-400 hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <ErrorBanner title="Couldn't update password" message={error} />}
              <div className="space-y-1.5">
                <label htmlFor="password" className={labelClass}>
                  New password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5C5C]" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirm" className={labelClass}>
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5C5C]" />
                  <Input
                    id="confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="h-12 w-full font-heading text-black"
                style={{ background: "linear-gradient(90deg,#f5c54a,#10b981)" }}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
