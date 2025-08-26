import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const sb = await createClient()
    const { data, error } = await sb
      .from("notifications")
      .select("id,title,body,created_at,read_at,user_id")
      .order("created_at", { ascending: false })
      .limit(5)
    if (error) throw error
    return NextResponse.json({ messages: data || [] })
  } catch {
    return NextResponse.json({
      messages: [
        { id: "n1", title: "Matchday update", body: "Matchday 5 extended due to power issues.", created_at: new Date().toISOString(), read_at: null },
        { id: "n2", title: "Reminder", body: "Report results with a screenshot.", created_at: new Date(Date.now() - 86400000).toISOString(), read_at: null },
      ],
    })
  }
}
