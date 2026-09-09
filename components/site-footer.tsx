"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
export function SiteFooter() {
  const path = usePathname()
  if (path.startsWith("/admin")) return null
  return (
    <footer className="fc-footer">
      <div className="fc-wrap">
        <div className="fc-footer-top">
          <Link href="/" className="fc-footer-brand">
            Weekend FC
          </Link>
          <nav aria-label="Footer navigation">
            <Link href="/standings">Standings</Link>
            <Link href="/fixtures">Matchdays</Link>
            <Link href="/rules">Rules</Link>
            <Link href="/dashboard">Your dashboard</Link>
          </nav>
        </div>
        <p className="fc-footer-note">
          An independent EA FC community. Not affiliated with Electronic Arts.
        </p>
      </div>
    </footer>
  )
}
