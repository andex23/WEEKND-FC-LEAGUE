"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import PlayerHub from "./_components/PlayerHub"
import UsefulLinks from "./_components/UsefulLinks"
import TournamentInvites from "./_components/TournamentInvites"
import { Skeleton } from "@/components/ui/skeleton"
import {
  loadPlayerHub,
  PlayerHubAccessError,
  type PlayerHubData,
} from "@/lib/dashboard/load-player-hub"
import { buildPlayerHub } from "@/lib/dashboard/player-hub"

export default function DashboardPage() {
  const [data, setData] = useState<PlayerHubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const currentRequest = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    currentRequest.current?.abort()
    const controller = new AbortController()
    currentRequest.current = controller
    let timedOut = false
    const timeout = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 15000)
    try {
      const result = await loadPlayerHub(fetch, controller.signal)
      if (controller.signal.aborted) return
      setData(result)
      setError(null)
      setAccessDenied(false)
    } catch (cause) {
      if (controller.signal.aborted && !timedOut) return
      setData(null)
      setAccessDenied(cause instanceof PlayerHubAccessError)
      setError(
        timedOut
          ? "Loading took too long. Please try again."
          : cause instanceof Error
            ? cause.message
            : "We couldn’t load your player hub. Please try again.",
      )
    } finally {
      window.clearTimeout(timeout)
      if (!controller.signal.aborted || timedOut) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const refresh = () => {
      if (!document.hidden) load()
    }
    const timer = window.setInterval(refresh, 30000)
    window.addEventListener("focus", refresh)
    return () => {
      currentRequest.current?.abort()
      window.clearInterval(timer)
      window.removeEventListener("focus", refresh)
    }
  }, [load])

  if (loading)
    return (
      <div className="fc-site fc-dashboard fc-player-hub">
        <div className="fc-wrap fc-hub-loading" role="status" aria-label="Loading your player hub">
          <span className="sr-only">Loading your player hub…</span>
          <Skeleton className="h-12 w-64 bg-[#202125]" />
          <Skeleton className="h-44 w-full bg-[#202125]" />
          <div className="fc-hub-grid">
            <Skeleton className="h-96 w-full bg-[#202125]" />
            <Skeleton className="h-96 w-full bg-[#202125]" />
          </div>
        </div>
      </div>
    )
  if (error || !data)
    return (
      <div className="fc-site fc-dashboard">
        <div className="fc-wrap fc-hub-error" role="alert">
          <h1>{accessDenied ? "Check your account access" : "Your player hub couldn’t load"}</h1>
          <p>{error || "Please try again."}</p>
          {accessDenied ? (
            <Link className="fc-button" href="/auth/login?next=/dashboard">
              Go to sign in
            </Link>
          ) : (
            <button
              className="fc-button"
              onClick={() => {
                setLoading(true)
                load()
              }}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    )

  const hub = buildPlayerHub(data)
  return (
    <PlayerHub
      {...data}
      invitations={<TournamentInvites entries={data.entries} onUpdate={load} />}
      quickActions={<UsefulLinks reportHref={hub.canReport ? "/report" : null} />}
      onPhotoChange={(url) =>
        setData((previous) =>
          previous ? { ...previous, player: { ...previous.player, avatar_url: url } } : previous,
        )
      }
    />
  )
}
