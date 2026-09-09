import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function EmailConfirmedPage() {
  return (
    <div className="fc-recovery">
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6 text-center md:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h1 className="mt-5 font-heading text-2xl text-white">Account confirmed</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8A8A8A]">
            Your email address is verified. If an admin has approved your registration, you can sign
            in now.
          </p>

          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-[#A8A8A8]">
            New registrations still need admin approval before league access is opened.
          </div>

          <Link
            href="/auth/login"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-lg font-heading text-black transition-opacity hover:opacity-90"
            style={{ background: "#d3ed9b" }}
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
