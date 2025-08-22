"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const user = null // Demo: no user authentication
  const loading = false

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="container-5xl">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gray-900 text-white px-2 py-1 rounded font-bold text-sm">WFC</div>
              <span className="font-semibold text-gray-900">Weeknd FC</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/standings" className="text-sm text-gray-700 hover:text-gray-900">Standings</Link>
            <Link href="/rules" className="text-sm text-gray-700 hover:text-gray-900">Rules</Link>
            {!loading && (
              <Link href={user ? "/dashboard" : "/auth/login"}>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  {user ? "Dashboard" : "Log in"}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

