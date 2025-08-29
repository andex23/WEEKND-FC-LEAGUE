"use client"

import { useState } from "react"
import Link from "next/link"

export function AdminOverlayNav() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="md:hidden px-2 py-1 rounded border border-[#1E1E1E] text-xs" onClick={() => setOpen(true)} aria-label="Open admin navigation">Menu</button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 sm:w-80 bg-[#141414] border-r border-[#1E1E1E] p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-heading font-bold text-lg">ADMIN</div>
              <button className="text-lg p-1 hover:bg-[#1E1E1E] rounded transition-colors" onClick={() => setOpen(false)}>✕</button>
            </div>
            <nav className="space-y-2">
              {[
                { key: "overview", label: "Overview", href: "/admin" },
                { key: "players", label: "Players", href: "/admin/players" },
                { key: "fixtures", label: "Fixtures", href: "/admin/fixtures" },
                { key: "tournaments", label: "Tournaments", href: "/admin/tournaments" },
                { key: "stats", label: "Stats", href: "/admin/stats" },
                { key: "reports", label: "Reports", href: "/admin" },
                { key: "messaging", label: "Messaging", href: "/admin" },
                { key: "settings", label: "Settings", href: "/admin" },
              ].map((item) => (
                <Link key={item.key} href={item.href} className="block px-4 py-3 rounded-md text-sm border bg-transparent hover:bg-[#0F0F0F] border-[#1E1E1E] transition-colors" onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}



