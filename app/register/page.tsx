import { RegistrationForm } from "@/components/registration-form"
import { BackgroundVideo } from "@/components/background-video"

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      <BackgroundVideo />

      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[520px] rounded-full bg-amber-500/[0.06] blur-[120px]" />
      </div>

      <div className="relative z-10 container-5xl py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> New Player Registration
          </span>
          <h1 className="mt-4 font-heading text-3xl text-white md:text-5xl">Create your player</h1>
          <p className="mt-2 text-sm text-[#8A8A8A] md:text-base">
            Build your card, claim your club, and join the Weekend FC League.
          </p>
        </div>

        <div className="mt-10 md:mt-12">
          <RegistrationForm />
        </div>
      </div>
    </div>
  )
}
