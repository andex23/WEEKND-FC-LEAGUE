"use client"

import Image from "next/image"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const LINKS = [
  { href: "/how-to-play", label: "How we play" },
  { href: "/standings", label: "Standings" },
  { href: "/fixtures", label: "Matchdays" },
  { href: "/rules", label: "Rules" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const adminArea = pathname === "/admin" || pathname.startsWith("/admin/")

  useEffect(() => {
    setOpen(false)
    if (adminArea) return
    const client = createClient()
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)))
    return () => subscription.unsubscribe()
  }, [adminArea, pathname])

  const logoutAdmin = async () => {
    setLoggingOut(true)
    setLogoutError(false)
    try {
      const response = await fetch("/api/admin/auth", { method: "DELETE" })
      if (!response.ok) throw new Error("Sign out failed")
      router.replace("/admin/login")
      router.refresh()
    } catch {
      setLogoutError(true)
    } finally {
      setLoggingOut(false)
    }
  }

  if (adminArea)
    return (
      <nav
        aria-label="Admin navigation"
        className="border-b border-[#1A1A1A] bg-[#070707] px-4 py-3 text-white"
      >
        <div className="container-5xl flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin" className="font-heading">
            Weekend FC <span className="ml-2 text-xs text-emerald-400">ADMIN</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/">View public site</Link>
            {pathname !== "/admin/login" && (
              <button onClick={logoutAdmin} disabled={loggingOut}>
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>
            )}
            {logoutError && (
              <span role="alert" className="text-rose-300">
                Couldn't sign out. Try again.
              </span>
            )}
          </div>
        </div>
      </nav>
    )

  return (
    <nav className="fc-nav" aria-label="Main navigation">
      <div className="fc-nav-inner">
        <div className="fc-nav-left">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="fc-nav-link"
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <Link
          href="/"
          className="fc-brand"
          aria-label="Weekend FC home"
          onClick={() => setOpen(false)}
        >
          <Image src="/logo.png" alt="" width={50} height={50} priority />
        </Link>
        <div className="fc-nav-right">
          <Link href={signedIn ? "/dashboard" : "/auth/login"} className="fc-nav-link">
            {signedIn ? "My dashboard" : "Player login"}
          </Link>
          {!signedIn && (
            <Link href="/register" className="fc-nav-join">
              Join the club
            </Link>
          )}
        </div>
        <button
          className="fc-menu-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="public-navigation"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
        {open && (
          <div
            id="public-navigation"
            className="fc-mobile-links"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false)
            }}
          >
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href={signedIn ? "/dashboard" : "/auth/login"} onClick={() => setOpen(false)}>
              {signedIn ? "My dashboard" : "Player login"}
            </Link>
            {!signedIn && (
              <Link href="/register" onClick={() => setOpen(false)}>
                Join the club
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
