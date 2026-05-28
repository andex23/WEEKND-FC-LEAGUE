"use client"

import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/standings", label: "Standings" },
  { href: "/rules", label: "Rules" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-40 border-b border-[#1A1A1A] bg-[#070707]/95 backdrop-blur">
      <div className="container-5xl">
        <div className="flex h-14 items-center justify-between px-4 md:px-0">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 font-heading text-sm text-black">
              W
            </span>
            <span className="font-heading text-lg tracking-wide text-white">Weekend FC</span>
          </Link>

          <button
            className="p-2 text-[#D1D1D1] transition-colors hover:text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? "✕" : "☰"}
          </button>

          <div
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
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-md bg-emerald-500 px-4 py-2 text-center font-heading text-sm text-black transition-colors hover:bg-emerald-400 md:ml-2 md:mt-0"
            >
              Register
            </Link>
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="rounded-md border border-[#2A2A2A] px-4 py-2 text-center font-heading text-sm text-white transition-colors hover:border-emerald-500/40 hover:bg-white/5 md:ml-1"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
