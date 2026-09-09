import { createClient } from "@/lib/supabase/server"

export async function getActiveTournament(client?: Awaited<ReturnType<typeof createClient>>) {
  const db = client ?? await createClient()
  const { data, error } = await db.from("tournaments")
    .select("id,name,status,season,start_at,end_at")
    .eq("status", "ACTIVE")
    .order("updated_at", { ascending: false })
    .limit(1).maybeSingle()
  if (error) throw error
  return data
}
