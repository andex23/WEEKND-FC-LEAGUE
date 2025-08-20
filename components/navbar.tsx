"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Settings, Table, LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { signOut } from "@/lib/actions"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        // Check if user is admin
        const { data: player } = await supabase.from("players").select("role").eq("user_id", session.user.id).single()

        setIsAdmin(player?.role === "ADMIN")
      }

      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: player } = await supabase.from("players").select("role").eq("user_id", session.user.id).single()

        setIsAdmin(player?.role === "ADMIN")
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="bg-gray-900 text-white px-2 py-1 rounded font-bold text-sm">WFC</div>
            <Link href="/" className="font-heading text-xl font-bold text-gray-900">
              Weeknd FC League
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/rules">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                Rules
              </Button>
            </Link>

            <Link href="/standings">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Table className="h-4 w-4 mr-2" />
                Standings
              </Button>
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin">
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                          <Settings className="h-4 w-4 mr-2" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <form action={handleSignOut}>
                      <Button variant="outline" size="sm" type="submit" className="border-gray-300 bg-transparent">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </form>
                  </>
                ) : (
                  <Link href="/auth/login">
                    <Button variant="default" size="sm" className="bg-gray-900 hover:bg-gray-800">
                      Login
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
