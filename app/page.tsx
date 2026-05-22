import Link from "next/link"
import { ArrowRight, BarChart3, CalendarDays, Gamepad2, ShieldCheck, Trophy, Users } from "lucide-react"
import { PlayerCard } from "@/components/player-card"
import { BackgroundVideo } from "@/components/background-video"

const STEPS = [
  { n: 1, icon: Users, title: "Register", body: "Build your player card — pick your club and console." },
  { n: 2, icon: Gamepad2, title: "Play", body: "Weekend fixtures in a round-robin schedule." },
  { n: 3, icon: Trophy, title: "Climb", body: "Report scores, build form, and climb the table." },
]

const FEATURES = [
  { icon: ShieldCheck, label: "Clubs Only" },
  { icon: CalendarDays, label: "Weekend Matches" },
  { icon: BarChart3, label: "Round-Robin" },
]

const ctaStyle = { background: "linear-gradient(90deg,#f5c54a,#10b981)" }

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      <BackgroundVideo />

      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-40 left-1/3 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute right-0 top-1/3 h-[360px] w-[420px] rounded-full bg-amber-500/[0.06] blur-[120px]" />
      </div>

      <div className="relative z-10 container-5xl section-pad space-y-20 px-4 md:px-0">
        {/* HERO */}
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> EA FC Weekend League
            </span>
            <h1 className="mt-5 font-heading text-4xl leading-[1.05] text-white md:text-6xl">
              Weekend FC
              <br />
              <span className="text-emerald-400">League</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-[#9E9E9E] md:text-lg">
              Compete every weekend. Report results. Build your card and climb the table.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-lg px-6 font-heading text-sm text-black"
                style={ctaStyle}
              >
                Create your player <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex h-12 items-center rounded-lg border border-[#2A2A2A] bg-[#111111] px-6 font-heading text-sm text-white transition-colors hover:border-emerald-500/40"
              >
                Sign in
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {FEATURES.map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#1E1E1E] bg-[#111111] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#9E9E9E]"
                >
                  <f.icon className="h-3.5 w-3.5 text-emerald-400" /> {f.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PlayerCard
              name="League MVP"
              username="weekendfc"
              consoleType="PS5"
              rating={99}
              tierLabel="Icon"
              stats={[
                { label: "GP", value: 24 },
                { label: "W", value: 20 },
                { label: "D", value: 2 },
                { label: "L", value: 2 },
                { label: "GLS", value: 78 },
                { label: "AST", value: 41 },
              ]}
            />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              How it works
            </span>
            <h2 className="mt-4 font-heading text-2xl text-white md:text-4xl">Three steps to the pitch</h2>
            <p className="mt-2 text-sm text-[#9E9E9E]">From sign-up to silverware — here&apos;s the run of play.</p>
          </div>

          <div className="relative mt-12">
            {/* connecting line behind the step nodes (desktop only) */}
            <div
              className="absolute inset-x-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent md:block"
              aria-hidden
            />
            <div className="grid gap-10 md:grid-cols-3 md:gap-6">
              {STEPS.map((s) => (
                <div key={s.n} className="flex flex-col items-center text-center">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-[#0A0A0A] font-heading text-xl text-emerald-400">
                    {s.n}
                  </div>
                  <div className="mt-5 w-full rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6 transition-colors hover:border-emerald-500/30">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                      <s.icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="mt-4 font-heading text-lg text-white">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#9E9E9E]">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-[#101010] p-8 text-center md:p-12">
          <h2 className="font-heading text-2xl text-white md:text-3xl">Ready to play?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#9E9E9E]">
            Build your player card in under a minute and join the next matchday.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-lg px-6 font-heading text-sm text-black"
            style={ctaStyle}
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  )
}
