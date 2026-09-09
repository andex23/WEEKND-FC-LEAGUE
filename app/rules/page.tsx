"use client"

import { PageHeading } from "@/components/league/ui"
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
      <div className="border-t border-[#1A1A1A] px-4 py-4 text-sm leading-relaxed text-[#C4C4C4]">
        {children}
      </div>
    </details>
  )
}

const linkClass = "font-medium text-emerald-400 underline-offset-2 hover:underline"

export default function RulesPage() {
  return (
    <div className="fc-site fc-rules">
      <div className="fc-wrap">
        <PageHeading
          eyebrow="Weekend FC / the rulebook"
          title="The rulebook"
          description="Everything you need for a fair game."
        />
        <div className="fc-rule-layout">
          <aside className="fc-rule-aside">
            <strong>The game comes first.</strong>
            <p>
              Know the format, respect your opponent, and keep a record of your results. These are
              the rules we all play by.
            </p>
            <a href="https://t.me/+17bCG-bp5XI0NmFl" target="_blank" rel="noopener noreferrer">
              Telegram channel ↗
            </a>
            <a href="https://discord.gg/YZumc42p" target="_blank" rel="noopener noreferrer">
              Discord community ↗
            </a>
          </aside>
          <div>
            {/* SECTIONS */}
            <div className="space-y-3">
              <Section number={1} icon={CalendarDays} title="Matchdays & Format">
                <ul className="space-y-1.5">
                  <li>• Matchdays: Friday through Sunday.</li>
                  <li>• Game: EA FC (current edition).</li>
                  <li>• Teams: Clubs only for league play.</li>
                  <li>• Match length: 6 minutes per half.</li>
                  <li>
                    • Season format: Round-robin (single or double). Admin announces before kickoff.
                  </li>
                </ul>
              </Section>

              <Section number={2} icon={Clock} title="Scheduling">
                <ul className="space-y-1.5">
                  <li>
                    • Fixtures are posted on the site. Players coordinate exact kick-off in{" "}
                    <a
                      className={linkClass}
                      href="https://discord.gg/YZumc42p"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Discord
                    </a>
                    .
                  </li>
                  <li>
                    • Be on time. Grace period: 10 minutes. After that, opponent may claim a forfeit
                    (admin decides).
                  </li>
                </ul>
              </Section>

              <Section number={3} icon={WifiOff} title="Disconnects / Power Cuts (DC Rule)">
                <ul className="space-y-1.5">
                  <li>• Before 20’ in-game: Full restart at 0–0.</li>
                  <li>• At/after 20’ in-game: Full restart, but the leader keeps an advantage.</li>
                  <li>• Advantage = the goal difference at the time of DC.</li>
                  <li>
                    • Example: it was 2–1 → restart with the leading side +1 (treated as a one-goal
                    head start in result reporting).
                  </li>
                  <li>• If scores were level at DC, restart 0–0.</li>
                  <li>• Repeated suspicious DCs may be reviewed and penalized.</li>
                </ul>
              </Section>

              <Section number={4} icon={Activity} title="Lag & Meet-ups">
                <ul className="space-y-1.5">
                  <li>• To avoid latency, players may meet up and play locally if both agree.</li>
                  <li>
                    • If playing online, try wired internet where possible. Report severe lag with
                    short clip/screenshot if a dispute arises.
                  </li>
                </ul>
              </Section>

              <Section number={5} icon={ClipboardCheck} title="Reporting Results">
                <ul className="space-y-1.5">
                  <li>
                    • After each match, results must be reported through one of these channels:
                  </li>
                  <li className="ml-4">
                    - <strong className="text-white">Website:</strong> Submit via the admin
                    dashboard
                  </li>
                  <li className="ml-4">
                    - <strong className="text-white">Discord:</strong> Post in #report-scores
                    channel with screenshot
                  </li>
                  <li className="ml-4">
                    - <strong className="text-white">Telegram:</strong> Send to admin or post in WFC
                    channel
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
                  <li>
                    • Abuse, harassment, or toxic behavior = warnings, suspensions, or removal.
                  </li>
                  <li>• Any disputes go to #disputes with evidence.</li>
                </ul>
              </Section>

              <Section number={8} icon={Flag} title="Forfeits & No-Shows">
                <ul className="space-y-1.5">
                  <li>
                    • If a player doesn’t show within 10 minutes, opponent can request a forfeit
                    win.
                  </li>
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
                  <li>
                    • Admin decisions aim for fairness and keeping the league running on time.
                  </li>
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
                  <li>• Fri–Sun, clubs only, 6-min halves.</li>
                  <li>
                    •{" "}
                    <strong className="text-white">
                      DC <span aria-label="less than">&lt;</span>20’
                    </strong>{" "}
                    → 0–0 restart. <strong className="text-white">DC ≥20’</strong> → restart, leader
                    keeps a goal-difference advantage.
                  </li>
                  <li>
                    • Report results via Website/Discord/Telegram with screenshot, admin confirms.
                  </li>
                  <li>• Win 3 / Draw 1 / Loss 0; tiebreakers: Pts → GD → GF → H2H.</li>
                  <li>• Meet up IRL to avoid lag; be respectful or get benched.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
