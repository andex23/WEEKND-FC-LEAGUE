"use client"

import { useMemo } from "react"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-[#1E1E1E] bg-[#141414] p-4" role="group">
      <summary className="cursor-pointer list-none select-none">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <span className="text-[#9E9E9E] group-open:rotate-180 transition-transform">▾</span>
        </div>
      </summary>
      <div className="mt-3 text-sm text-[#D1D1D1]">{children}</div>
    </details>
  )
}

export default function RulesPage() {
  const lastUpdated = useMemo(() => new Date().toLocaleDateString(), [])

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl font-extrabold">FC WEEKEND — League Rules</h1>
          <p className="text-sm text-[#9E9E9E]">Last updated: {lastUpdated}</p>
        </header>

        <div className="space-y-4">
          <Section title="1) Matchdays & Format">
            <ul className="space-y-1">
              <li>• Matchdays: Saturday & Sunday only.</li>
              <li>• Game: EA FC (current edition).</li>
              <li>• Teams: Clubs only for league play.</li>
              <li>• Match length: 6 minutes per half.</li>
              <li>• Season format: Round-robin (single or double). Admin announces before kickoff.</li>
            </ul>
          </Section>

          <Section title="2) Scheduling">
            <ul className="space-y-1">
              <li>• Fixtures are posted on the site. Players coordinate exact kick-off in Discord.</li>
              <li>• Be on time. Grace period: 10 minutes. After that, opponent may claim a forfeit (admin decides).</li>
            </ul>
          </Section>

          <Section title="3) Disconnects / Power Cuts (DC Rule)">
            <ul className="space-y-1">
              <li>• Before 20’ in-game: Full restart at 0–0.</li>
              <li>• At/after 20’ in-game: Full restart, but the leader keeps an advantage.</li>
              <li>• Advantage = the goal difference at the time of DC.</li>
              <li>• Example: it was 2–1 → restart with the leading side +1 (treated as a one-goal head start in result reporting).</li>
              <li>• If scores were level at DC, restart 0–0.</li>
              <li>• Repeated suspicious DCs may be reviewed and penalized.</li>
            </ul>
          </Section>

          <Section title="4) Lag & Meet-ups">
            <ul className="space-y-1">
              <li>• To avoid latency, players may meet up and play locally if both agree.</li>
              <li>• If playing online, try wired internet where possible. Report severe lag with short clip/screenshot if a dispute arises.</li>
            </ul>
          </Section>

          <Section title="5) Reporting Results">
            <ul className="space-y-1">
              <li>• After each match, one player must submit the score via the site or #report-scores in Discord with a screenshot.</li>
              <li>• Opponent should confirm.</li>
              <li>• Results are official only after Admin approval.</li>
            </ul>
          </Section>

          <Section title="6) Points & Standings">
            <ul className="space-y-1">
              <li>• Win = 3 · Draw = 1 · Loss = 0</li>
              <li>• Table ordered by:</li>
            </ul>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Points</li>
              <li>Goal Difference (GD)</li>
              <li>Goals Scored (GF)</li>
              <li>Head-to-Head</li>
              <li>Admin decision (rare tiebreak)</li>
            </ol>
          </Section>

          <Section title="7) Discipline & Fair Play">
            <ul className="space-y-1">
              <li>• Record of Yellow/Red cards is tracked.</li>
              <li>• Abuse, harassment, or toxic behavior = warnings, suspensions, or removal.</li>
              <li>• Any disputes go to #disputes with evidence.</li>
            </ul>
          </Section>

          <Section title="8) Forfeits & No-Shows">
            <ul className="space-y-1">
              <li>• If a player doesn’t show within 10 minutes, opponent can request a forfeit win.</li>
              <li>• Standard forfeit score: 3–0 (admin may adjust in special cases).</li>
            </ul>
          </Section>

          <Section title="9) Content & Clips (optional but encouraged)">
            <ul className="space-y-1">
              <li>• Share highlights in #clips-and-highlights.</li>
              <li>• Streaming is allowed; do not stream private chats without consent.</li>
            </ul>
          </Section>

          <Section title="10) Admin & Appeals">
            <ul className="space-y-1">
              <li>• Admin decisions aim for fairness and keeping the league running on time.</li>
              <li>• You can appeal a decision within 24 hours with evidence.</li>
            </ul>
          </Section>

          <details className="group rounded-2xl border border-[#1E1E1E] bg-[#141414] p-4" role="group">
            <summary className="cursor-pointer list-none select-none">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">TL;DR</h2>
                <span className="text-[#9E9E9E] group-open:rotate-180 transition-transform">▾</span>
              </div>
            </summary>
            <div className="mt-3 text-sm text-[#D1D1D1]">
              <ul className="space-y-1">
                <li>• Sat/Sun, clubs only, 6-min halves.</li>
                <li>• <strong>DC <span aria-label="less than">&lt;</span>20’</strong> → 0–0 restart. <strong>DC ≥20’</strong> → restart, leader keeps a goal-difference advantage.</li>
                <li>• Report with screenshot, admin confirms.</li>
                <li>• Win 3 / Draw 1 / Loss 0; tiebreakers: Pts → GD → GF → H2H.</li>
                <li>• Meet up IRL to avoid lag; be respectful or get benched.</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
