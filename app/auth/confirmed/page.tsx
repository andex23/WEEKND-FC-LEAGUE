import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { BackgroundVideo } from "@/components/background-video"

export default function EmailConfirmedPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 py-12">
      <BackgroundVideo />

      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6 text-center md:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h1 className="mt-5 font-heading text-2xl text-white">Email confirmed</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8A8A8A]">
            Your email address is verified. An admin will review your registration shortly — you&apos;ll
            be able to sign in as soon as your account is approved.
          </p>

          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-[#A8A8A8]">
            We&apos;ll let you know once you&apos;re cleared to play. No further action needed for now.
          </div>

          <Link
            href="/auth/login"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-lg font-heading text-black transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(90deg,#f5c54a,#10b981)" }}
          >
            Continue to sign in
          </Link>

          <Link
            href="/"
            className="mt-3 inline-block text-xs font-medium text-[#7A7A7A] transition-colors hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
