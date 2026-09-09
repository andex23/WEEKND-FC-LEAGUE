"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

const TRACKER_URL = "https://yerwptchfksahaiiezki.supabase.co/functions/v1/site-track"
const SITE_KEY = "94f9aa04-d15f-499a-825e-0bf8cab939d0"
const HOSTS = new Set(["weekendfc.site", "www.weekendfc.site"])

function storedId(storage: Storage, key: string, fallback: string) {
  const value = storage.getItem(key) || fallback
  storage.setItem(key, value)
  return value
}

export function DruAnalytics() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)
  const identity = useRef<{ visitorId: string; sessionId: string } | null>(null)

  useEffect(() => {
    if (!pathname || !HOSTS.has(window.location.hostname) || lastPath.current === pathname) return

    if (!identity.current) {
      identity.current = { visitorId: crypto.randomUUID(), sessionId: crypto.randomUUID() }
      try {
        identity.current.visitorId = storedId(localStorage, "dru_analytics_visitor", identity.current.visitorId)
        identity.current.sessionId = storedId(sessionStorage, "dru_analytics_session", identity.current.sessionId)
      } catch {
        // Tracking still works for this tab when browser storage is unavailable.
      }
    }

    const referrer = lastPath.current
      ? `${window.location.origin}${lastPath.current}`
      : document.referrer
    lastPath.current = pathname

    void fetch(TRACKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        siteKey: SITE_KEY,
        event: "page_view",
        path: pathname,
        ...identity.current,
        referrer,
        metadata: { device: /iPad|Tablet/i.test(navigator.userAgent) ? "tablet" : /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop" },
      }),
    }).catch(() => {
      // Analytics must never interrupt league navigation.
    })
  }, [pathname])

  return null
}
