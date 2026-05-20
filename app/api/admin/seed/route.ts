import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const demoUsers = [
  { username: "user1", name: "Player One", console: "PS5", location: "London", preferred_club: "Arsenal" },
  { username: "user2", name: "Player Two", console: "XBOX", location: "Manchester", preferred_club: "Chelsea" },
  { username: "user3", name: "Player Three", console: "PS5", location: "Liverpool", preferred_club: "Liverpool" },
  { username: "user4", name: "Player Four", console: "PC", location: "Leeds", preferred_club: "Man United" },
  { username: "user5", name: "Player Five", console: "PS5", location: "Birmingham", preferred_club: "Aston Villa" },
  { username: "user6", name: "Player Six", console: "XBOX", location: "Newcastle", preferred_club: "Newcastle" },
] as const

// Creates approved demo players for local testing. Password is "Password123!".
export async function POST() {
  const admin = createAdminClient()
  const created: { username: string; password: string }[] = []

  for (const u of demoUsers) {
    try {
      const { data, error } = await admin.auth.admin.createUser({
        email: `${u.username}@weekndfc.local`,
        password: "Password123!",
        email_confirm: true,
        user_metadata: { username: u.username, name: u.name },
      })
      if (error || !data.user) throw error ?? new Error("No user returned")

      const { error: playerError } = await admin.from("players").upsert(
        {
          id: data.user.id,
          username: u.username,
          email: `${u.username}@weekndfc.local`,
          name: u.name,
          console: u.console,
          location: u.location,
          preferred_club: u.preferred_club,
          role: "PLAYER",
          status: "approved",
        },
        { onConflict: "id" },
      )
      if (playerError) throw playerError

      created.push({ username: u.username, password: "Password123!" })
    } catch (e) {
      console.error("Seed user failed:", u.username, e instanceof Error ? e.message : e)
    }
  }

  return NextResponse.json({ ok: true, created })
}
