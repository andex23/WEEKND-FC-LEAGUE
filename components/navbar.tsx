"use client"

import Link from "next/link"
import { useState } from "react"

export function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-40 border-b border-[#1A1A1A] bg-[#050505]/95 backdrop-blur">
      <div className="container-5xl">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="font-heading font-extrabold tracking-wide text-white">Weekend FC</Link>
          <button className="md:hidden text-[#D1D1D1]" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">☰</button>
          <div className={`md:flex items-center gap-6 text-sm uppercase ${open ? "flex" : "hidden"}`}>
            <Link href="/standings" className="text-[#D1D1D1] hover:text-white">Standings</Link>
            <Link href="/rules" className="text-[#D1D1D1] hover:text-white">Rules</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

