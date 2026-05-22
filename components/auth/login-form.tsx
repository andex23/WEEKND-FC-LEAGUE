"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signIn } from "@/lib/actions"

const labelClass = "text-[11px] font-bold uppercase tracking-[0.16em] text-[#9E9E9E]"
const inputClass =
  "h-11 rounded-lg border-[#2A2A2A] bg-[#0F0F0F] pl-10 text-white placeholder:text-[#5C5C5C] focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-12 w-full font-heading text-black"
      style={{ background: "linear-gradient(90deg,#f5c54a,#10b981)" }}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
        </>
      ) : (
        "Sign in"
      )}
    </Button>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(signIn, null)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (state?.success) {
      toast.success("Signed in — welcome back!")
      router.push("/dashboard")
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, router])

  return (
    <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6 md:p-8">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 font-heading text-xl text-black">
          W
        </div>
        <h1 className="mt-4 font-heading text-2xl text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-[#8A8A8A]">Sign in to your Weekend FC account</p>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5C5C]" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-xs font-medium text-emerald-400 hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5C5C]" />
            <Input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Your password"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C6C6C] transition-colors hover:text-white"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <SubmitButton />

        <p className="text-center text-xs text-[#7A7A7A]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-emerald-400 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  )
}
