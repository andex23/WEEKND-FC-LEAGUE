"use client"

import { useMemo } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Flag,
  Gavel,
  ScrollText,
  Send,
  ShieldAlert,
  Trophy,
  Video,
  WifiOff,
  Zap,
} from "lucide-react"

function Section({
  number,
  icon: Icon,
  title,
  children,
}: {
  number: number
  icon: LucideIcon
  title: string
  children: React.ReactNode
}) {
  return (
    <details
      className="group overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111] transition-colors hover:border-[#2A2A2A]"
      role="group"
    >
      <summary className="flex cursor-pointer list-none select-none items-center gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 font-heading text-sm text-emerald-400">
          {number}
        </span>
        <Icon className="h-4 w-4 shrink-0 text-[#7A7A7A]" />
        <h2 className="flex-1 font-heading text-sm text-white sm:text-base">{title}</h2>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#7A7A7A] transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-[#1A1A1A] px-4 py-4 text-sm leading-relaxed text-[#C4C4C4]">{children}</div>
    </details>
  )
}

const linkClass = "font-medium text-emerald-400 underline-offset-2 hover:underline"

export default function RulesPage() {
  const lastUpdated = useMemo(() => new Date().toLocaleDateString(), [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
      </div>

      <div className="relative container-5xl section-pad space-y-6 px-4 md:px-0">
        {/* HEADER */}
        <header>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
            <ScrollText className="h-3 w-3" /> Rulebook
          </span>
          <h1 className="mt-3 font-heading text-3xl text-white md:text-4xl">League Rules</h1>
          <p className="mt-1 text-sm text-[#9E9E9E]">
            FC Weekend · Last updated {lastUpdated}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="https://t.me/+17bCG-bp5XI0NmFl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#1E1E1E] bg-[#111111] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#D1D1D1] transition-colors hover:border-emerald-500/40 hover:text-white"
            >
              <Send className="h-3.5 w-3.5 text-emerald-400" /> Telegram Channel
            </a>
            <a
              href="https://discord.gg/YZumc42p"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#1E1E1E] bg-[#111111] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#D1D1D1] transition-colors hover:border-emerald-500/40 hover:text-white"
            >
              <Zap className="h-3.5 w-3.5 text-emerald-400" /> Discord Server
            </a>
          </div>
        </header>

        {/* SECTIONS */}
        <div className="space-y-3">
          <Section number={1} icon={CalendarDays} title="Matchdays & Format">
            <ul className="space-y-1.5">
              <li>• Matchdays: Saturday &amp; Sunday only.</li>
              <li>• Game: EA FC (current edition).</li>
              <li>• Teams: Clubs only for league play.</li>
              <li>• Match length: 6 minutes per half.</li>
              <li>• Season format: Round-robin (single or double). Admin announces before kickoff.</li>
            </ul>
          </Section>

          <Section number={2} icon={Clock} title="Scheduling">
            <ul className="space-y-1.5">
              <li>
                • Fixtures are posted on the site. Players coordinate exact kick-off in{" "}
                <a className={linkClass} href="https://discord.gg/YZumc42p" target="_blank" rel="noopener noreferrer">
                  Discord
                </a>
                .
              </li>
              <li>• Be on time. Grace period: 10 minutes. After that, opponent may claim a forfeit (admin decides).</li>
            </ul>
          </Section>

          <Section number={3} icon={WifiOff} title="Disconnects / Power Cuts (DC Rule)">
            <ul className="space-y-1.5">
              <li>• Before 20’ in-game: Full restart at 0–0.</li>
              <li>• At/after 20’ in-game: Full restart, but the leader keeps an advantage.</li>
              <li>• Advantage = the goal difference at the time of DC.</li>
              <li>
                • Example: it was 2–1 → restart with the leading side +1 (treated as a one-goal head start in result
                reporting).
              </li>
              <li>• If scores were level at DC, restart 0–0.</li>
              <li>• Repeated suspicious DCs may be reviewed and penalized.</li>
            </ul>
          </Section>

          <Section number={4} icon={Activity} title="Lag & Meet-ups">
            <ul className="space-y-1.5">
              <li>• To avoid latency, players may meet up and play locally if both agree.</li>
              <li>
                • If playing online, try wired internet where possible. Report severe lag with short clip/screenshot if
                a dispute arises.
              </li>
            </ul>
          </Section>

          <Section number={5} icon={ClipboardCheck} title="Reporting Results">
            <ul className="space-y-1.5">
              <li>• After each match, results must be reported through one of these channels:</li>
              <li className="ml-4">
                - <strong className="text-white">Website:</strong> Submit via the admin dashboard
              </li>
              <li className="ml-4">
                - <strong className="text-white">Discord:</strong> Post in #report-scores channel with screenshot
              </li>
              <li className="ml-4">
                - <strong className="text-white">Telegram:</strong> Send to admin or post in WFC channel
              </li>
              <li>• Include match screenshot as proof of result.</li>
              <li>• Opponent should confirm the reported score.</li>
              <li>• Results are official only after Admin approval.</li>
              <li>• Failure to report results within 24 hours may result in forfeit.</li>
            </ul>
          </Section>

          <Section number={6} icon={Trophy} title="Points & Standings">
            <ul className="space-y-1.5">
              <li>• Win = 3 · Draw = 1 · Loss = 0</li>
              <li>• Table ordered by:</li>
            </ul>
            <ol className="ml-5 mt-2 list-decimal space-y-1">
              <li>Points</li>
              <li>Goal Difference (GD)</li>
              <li>Goals Scored (GF)</li>
              <li>Head-to-Head</li>
              <li>Admin decision (rare tiebreak)</li>
            </ol>
          </Section>

          <Section number={7} icon={ShieldAlert} title="Discipline & Fair Play">
            <ul className="space-y-1.5">
              <li>• Record of Yellow/Red cards is tracked.</li>
              <li>• Abuse, harassment, or toxic behavior = warnings, suspensions, or removal.</li>
              <li>• Any disputes go to #disputes with evidence.</li>
            </ul>
          </Section>

          <Section number={8} icon={Flag} title="Forfeits & No-Shows">
            <ul className="space-y-1.5">
              <li>• If a player doesn’t show within 10 minutes, opponent can request a forfeit win.</li>
              <li>• Standard forfeit score: 3–0 (admin may adjust in special cases).</li>
            </ul>
          </Section>

          <Section number={9} icon={Video} title="Content & Clips (optional but encouraged)">
            <ul className="space-y-1.5">
              <li>• Share highlights in #clips-and-highlights.</li>
              <li>• Streaming is allowed; do not stream private chats without consent.</li>
            </ul>
          </Section>

          <Section number={10} icon={Gavel} title="Admin & Appeals">
            <ul className="space-y-1.5">
              <li>• Admin decisions aim for fairness and keeping the league running on time.</li>
              <li>• You can appeal a decision within 24 hours with evidence.</li>
            </ul>
          </Section>

          {/* TL;DR */}
          <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-[#101010] p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <h2 className="font-heading text-sm text-white sm:text-base">TL;DR</h2>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-[#C4C4C4]">
              <li>• Sat/Sun, clubs only, 6-min halves.</li>
              <li>
                • <strong className="text-white">DC <span aria-label="less than">&lt;</span>20’</strong> → 0–0 restart.{" "}
                <strong className="text-white">DC ≥20’</strong> → restart, leader keeps a goal-difference advantage.
              </li>
              <li>• Report results via Website/Discord/Telegram with screenshot, admin confirms.</li>
              <li>• Win 3 / Draw 1 / Loss 0; tiebreakers: Pts → GD → GF → H2H.</li>
              <li>• Meet up IRL to avoid lag; be respectful or get benched.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
