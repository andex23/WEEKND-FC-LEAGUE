"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/standings", label: "Standings" },
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
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)))
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
    } catch { setLogoutError(true) }
    finally { setLoggingOut(false) }
  }

  if (adminArea) return (
    <nav aria-label="Admin navigation" className="border-b border-[#1A1A1A] bg-[#070707] px-4 py-3 text-white">
      <div className="container-5xl flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="font-heading">Weekend FC <span className="ml-2 text-xs text-emerald-400">ADMIN</span></Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/">View public site</Link>
          {pathname !== "/admin/login" && <button onClick={logoutAdmin} disabled={loggingOut}>{loggingOut ? "Signing out..." : "Sign out"}</button>}
          {logoutError && <span role="alert" className="text-rose-300">Couldn't sign out. Try again.</span>}
        </div>
      </div>
    </nav>
  )

  return (
    <nav className="sticky top-0 z-40 border-b border-[#1A1A1A] bg-[#070707]/95 backdrop-blur">
      <div className="container-5xl">
        <div className="flex h-14 items-center justify-between px-4 md:px-0">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="relative h-9 w-9 overflow-hidden rounded-full border border-amber-300/35 bg-[#eadfc9] shadow-[0_0_18px_rgba(16,185,129,0.18)]">
              <Image src="/logo.png" alt="" fill sizes="36px" className="object-cover" priority />
            </span>
            <span className="font-heading text-lg tracking-wide text-white">Weekend FC</span>
          </Link>

          <button
            className="p-2 text-[#D1D1D1] transition-colors hover:text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={open}
            aria-controls="public-navigation"
          >
            {open ? "✕" : "☰"}
          </button>

          <div
            id="public-navigation"
            className={cn(
              "items-center gap-1 md:flex",
              open
                ? "absolute left-0 right-0 top-full flex flex-col items-stretch border-b border-[#1A1A1A] bg-[#070707]/98 p-3 backdrop-blur md:relative md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0"
                : "hidden",
            )}
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wider text-[#9E9E9E] transition-colors hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            {!signedIn && <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-md bg-emerald-500 px-4 py-2 text-center font-heading text-sm text-black transition-colors hover:bg-emerald-400 md:ml-2 md:mt-0"
            >
              Register
            </Link>}
            <Link
              href={signedIn ? "/dashboard" : "/auth/login"}
              onClick={() => setOpen(false)}
              className="rounded-md border border-[#2A2A2A] px-4 py-2 text-center font-heading text-sm text-white transition-colors hover:border-emerald-500/40 hover:bg-white/5 md:ml-1"
            >
              {signedIn ? "My dashboard" : "Player login"}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
