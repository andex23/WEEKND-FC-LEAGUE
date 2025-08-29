"use client"

import Link from "next/link"
import { useState } from "react"

export function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-40 border-b border-[#1A1A1A] bg-[#050505]/95 backdrop-blur">
      <div className="container-5xl">
        <div className="flex justify-between items-center h-14 px-4 md:px-0">
          <Link href="/" className="font-heading font-extrabold tracking-wide text-white text-lg md:text-xl">Weekend FC</Link>
          <button 
            className="md:hidden text-[#D1D1D1] p-2 hover:text-white transition-colors" 
            onClick={() => setOpen((v) => !v)} 
            aria-label="Toggle navigation"
          >
            {open ? "✕" : "☰"}
          </button>
          <div className={`md:flex items-center gap-6 text-sm uppercase ${open ? "flex absolute top-full left-0 right-0 bg-[#050505]/95 backdrop-blur border-b border-[#1A1A1A] flex-col md:flex-row md:relative md:border-0 md:bg-transparent" : "hidden"}`}>
            <Link 
              href="/standings" 
              className="text-[#D1D1D1] hover:text-white px-4 py-3 md:px-0 md:py-0 transition-colors"
              onClick={() => setOpen(false)}
            >
              Standings
            </Link>
            <Link 
              href="/rules" 
              className="text-[#D1D1D1] hover:text-white px-4 py-3 md:px-0 md:py-0 transition-colors"
              onClick={() => setOpen(false)}
            >
              Rules
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

