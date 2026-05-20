import { createClient } from "./server"
import type { Player } from "./types"

/** The authenticated Supabase user for the current request, or null. */
export async function getSessionUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** The player profile row for the current request, or null if not signed in. */
export async function getCurrentPlayer(): Promise<Player | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from("players").select("*").eq("id", user.id).maybeSingle()
  return (data as Player) ?? null
}
