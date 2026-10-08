"use client"

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cleanReferrer, shouldTrackPage } from '@/lib/analytics-policy'

const ID = 'G-F1DCSXWT0Q'
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; 'ga-disable-G-F1DCSXWT0Q'?: boolean }

/** Never load analytics on verification/recovery entry pages or preview builds. */
export function GoogleAnalytics() {
  const pathname = usePathname()
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const allowed = Boolean(pathname && shouldTrackPage(window.location.hostname, pathname))
    ;(window as AnalyticsWindow)[`ga-disable-${ID}`] = !allowed
    setEnabled(allowed)
    if (!allowed || !ready) return
    const win = window as AnalyticsWindow
    const page = `${window.location.origin}${pathname}`
    // Override automatic URL/referrer values so neither query nor fragment is sent.
    win.gtag?.('config', ID, { send_page_view: false, page_location: page, page_referrer: cleanReferrer(document.referrer) })
    win.gtag?.('event', 'page_view', { page_location: page, page_referrer: cleanReferrer(document.referrer), page_title: document.title })
  }, [pathname, ready])

  if (!enabled) return null
  return <Script id="google-analytics-library" src={`https://www.googletagmanager.com/gtag/js?id=${ID}`} strategy="afterInteractive" onReady={() => {
    const win = window as AnalyticsWindow
    win.dataLayer ||= []
    win.gtag ||= function (..._args: unknown[]) { win.dataLayer!.push(arguments) }
    win.gtag('js', new Date())
    setReady(true)
  }} />
}
