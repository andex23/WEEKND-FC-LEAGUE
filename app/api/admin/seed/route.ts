import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const demoUsers = [
  { username: "seed01", name: "Kai Morgan", console: "PS5", location: "London", preferred_club: "Arsenal" },
  { username: "seed02", name: "Mason Cole", console: "XBOX", location: "Manchester", preferred_club: "Man City" },
  { username: "seed03", name: "Leo Brooks", console: "PS5", location: "Liverpool", preferred_club: "Liverpool" },
  { username: "seed04", name: "Noah Reed", console: "PC", location: "Leeds", preferred_club: "Man United" },
  { username: "seed05", name: "Jude Carter", console: "PS5", location: "Birmingham", preferred_club: "Aston Villa" },
  { username: "seed06", name: "Toby Hayes", console: "XBOX", location: "Newcastle", preferred_club: "Newcastle" },
  { username: "seed07", name: "Andre Miles", console: "PS5", location: "Croydon", preferred_club: "Crystal Palace" },
  { username: "seed08", name: "Eli Stone", console: "PC", location: "Brighton", preferred_club: "Brighton" },
  { username: "seed09", name: "Owen Price", console: "PS5", location: "Nottingham", preferred_club: "Nottingham Forest" },
  { username: "seed10", name: "Ryan Shaw", console: "XBOX", location: "Bournemouth", preferred_club: "Bournemouth" },
  { username: "seed11", name: "Micah West", console: "PS5", location: "London", preferred_club: "Chelsea" },
  { username: "seed12", name: "Caleb Quinn", console: "PC", location: "London", preferred_club: "Spurs" },
] as const

// Creates approved demo players for local testing. Password is "Password123!".
export async function POST() {
  const admin = createAdminClient()
  const password = "Password123!"
  const created: { email: string; username: string; password: string }[] = []
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const existingAuthByEmail = new Map((listed?.users || []).map((user) => [user.email?.toLowerCase(), user]))

  for (const u of demoUsers) {
    const email = `${u.username}@weekendfc.local`
    try {
      let user = existingAuthByEmail.get(email)
      if (!user) {
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username: u.username, name: u.name },
        })
        if (error || !data.user) throw error ?? new Error("No user returned")
        user = data.user
      }

      const { error: playerError } = await admin.from("players").upsert(
        {
          id: user.id,
          username: u.username,
          email,
          name: u.name,
          console: u.console,
          location: u.location,
          preferred_club: u.preferred_club,
          assigned_club: null,
          role: "PLAYER",
          status: "approved",
        },
        { onConflict: "id" },
      )
      if (playerError) throw playerError

      created.push({ email, username: u.username, password })
    } catch (e) {
      console.error("Seed user failed:", u.username, e instanceof Error ? e.message : e)
    }
  }

  return NextResponse.json({ ok: true, created, count: created.length })
}
