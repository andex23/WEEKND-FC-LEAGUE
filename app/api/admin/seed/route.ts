import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const demoUsers = [
  { email: "user1@example.com", password: "Password123!", name: "Player One", console: "PS5", location: "London", preferred_club: "Arsenal" },
  { email: "user2@example.com", password: "Password123!", name: "Player Two", console: "XBOX", location: "Manchester", preferred_club: "Chelsea" },
  { email: "user3@example.com", password: "Password123!", name: "Player Three", console: "PS5", location: "Liverpool", preferred_club: "Liverpool" },
  { email: "user4@example.com", password: "Password123!", name: "Player Four", console: "PC", location: "Leeds", preferred_club: "Leeds United" },
  { email: "user5@example.com", password: "Password123!", name: "Player Five", console: "PS5", location: "Birmingham", preferred_club: "Aston Villa" },
  { email: "user6@example.com", password: "Password123!", name: "Player Six", console: "XBOX", location: "Newcastle", preferred_club: "Newcastle" },
]

export async function POST() {
  const sb = await createClient()
  const created: any[] = []
  for (const u of demoUsers) {
    try {
      const { data: signUpData, error: signUpError } = await sb.auth.signUp({ email: u.email, password: u.password })
      if (signUpError) throw signUpError
      const userId = signUpData.user?.id
      if (!userId) throw new Error("No user id")

      // Upsert into profiles/users table depending on schema
      await sb.from("users").upsert({ id: userId, name: u.name, email: u.email, console: u.console, location: u.location, status: "pending" }, { onConflict: "id" })
      await sb.from("profiles").upsert({ id: userId, name: u.name, preferred_club: u.preferred_club, console: u.console }, { onConflict: "id" }).catch(() => null)

      created.push({ id: userId, email: u.email, password: u.password, name: u.name })
    } catch (e: any) {
      console.error("Seed user failed:", u.email, e?.message || e)
    }
  }

  return NextResponse.json({ ok: true, users: created })
}
