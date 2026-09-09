"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

export function HomeHero() {
  const video = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      if (preference.matches) video.current?.pause()
      else video.current?.play().catch(() => {})
    }
    sync()
    preference.addEventListener("change", sync)
    return () => preference.removeEventListener("change", sync)
  }, [])
  return (
    <section className="club-hero club-hero-alive">
      <div className="club-film" aria-hidden="true">
        <video ref={video} muted loop playsInline preload="metadata">
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="club-hero-content">
        <p className="club-hero-lead">The online EA FC league. Built around your weekend.</p>
        <h1>
          WEEKEND<span>FC</span>
        </h1>
        <div className="club-hero-image">
          <img
            src="/weekend-ball.jpg"
            alt="A black leather football in soft studio light"
            fetchPriority="high"
            width={1536}
            height={1024}
          />
        </div>
        <div className="club-hero-intro">
          <h2>Same game. Real rivalries.</h2>
          <p>
            Pick your club. Meet your next opponent.
            <br />
            Give your weekends something to play for.
          </p>
          <div>
            <Link href="/register" className="fc-button">
              Create your player
            </Link>
            <Link href="#the-game" className="club-secondary">
              How we play
            </Link>
          </div>
        </div>
      </div>
      <div className="club-format" aria-label="Competition format">
        <span>Friday – Sunday</span>
        <span>Clubs only</span>
        <span>6-minute halves</span>
        <span>Round-robin league</span>
      </div>
    </section>
  )
}
