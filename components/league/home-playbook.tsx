"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Check, Gamepad2, Trophy, UserRound } from "lucide-react"

const stages = [
  {
    title: "Register",
    heading: "Your club. Your name on the team sheet.",
    text: "Create your player, choose your platform and preferred club, and check your connection. Once approved, accept your tournament invitation to claim your place.",
    detail: "PS5, Xbox Series X/S and PC registration",
    link: "/register",
    action: "Join the league",
    icon: UserRound,
  },
  {
    title: "Play",
    heading: "A familiar game. A new rival every matchday.",
    text: "Check your fixtures, arrange a time with your opponent, and play on Saturday or Sunday. Clubs only, six-minute halves, with the same rules for everyone.",
    detail: "Keep a screenshot of your final score",
    link: "/fixtures",
    action: "Explore matchdays",
    icon: Gamepad2,
  },
  {
    title: "Climb",
    heading: "Every result becomes part of your season.",
    text: "Report your score for admin confirmation. Earn three points for a win, one for a draw, and follow your progress through the league table.",
    detail: "Points, goal difference, then goals scored",
    link: "/standings",
    action: "View the table",
    icon: Trophy,
  },
]
export function HomePlaybook() {
  const [selected, setSelected] = useState(0)
  const stage = stages[selected]
  const Icon = stage.icon
  return (
    <section id="the-game" className="club-playbook fc-wrap">
      <div className="club-playbook-heading">
        <h2>
          A proper league.
          <br />A weekend thing.
        </h2>
        <p>
          A season to follow, opponents to get to know, and a reason to come back next Saturday.
        </p>
      </div>
      <div className="club-playbook-layout">
        <div className="club-stages" role="tablist" aria-label="How Weekend FC works">
          {stages.map((s, i) => (
            <button
              key={s.title}
              id={`stage-${i}`}
              type="button"
              role="tab"
              aria-selected={selected === i}
              aria-controls="club-stage-panel"
              tabIndex={selected === i ? 0 : -1}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => {
                let target = i
                if (e.key === "ArrowDown" || e.key === "ArrowRight") target = (i + 1) % 3
                else if (e.key === "ArrowUp" || e.key === "ArrowLeft") target = (i + 2) % 3
                else if (e.key === "Home") target = 0
                else if (e.key === "End") target = 2
                else return
                e.preventDefault()
                setSelected(target)
                document.getElementById(`stage-${target}`)?.focus()
              }}
            >
              <span className="club-stage-count">{i + 1}</span>
              <span>{s.title}</span>
              <ArrowUpRight size={22} />
            </button>
          ))}
        </div>
        <div
          id="club-stage-panel"
          role="tabpanel"
          aria-labelledby={`stage-${selected}`}
          tabIndex={0}
          className="club-stage-panel"
        >
          <div className="club-stage-symbol" aria-hidden="true">
            <Icon size={60} strokeWidth={1} />
            <span>
              {selected === 0
                ? "Your place in the club"
                : selected === 1
                  ? "The weekend fixture"
                  : "The season so far"}
            </span>
          </div>
          <div>
            <h3>{stage.heading}</h3>
            <p>{stage.text}</p>
            <p className="club-stage-detail">
              <Check size={15} />
              {stage.detail}
            </p>
            <Link href={stage.link} className="fc-text-link">
              {stage.action}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </div>
      <div className="club-community">
        <span>Good games start with good opponents.</span>
        <Link href="/rules">
          Read the rulebook <ArrowUpRight size={15} />
        </Link>
      </div>
    </section>
  )
}
