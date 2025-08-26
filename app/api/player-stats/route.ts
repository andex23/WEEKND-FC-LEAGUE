import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    let topScorers: any[] = []
    let topAssists: any[] = []
    let discipline: any[] = []

    try {
      const { data: scorersData, error: scorersError } = await supabase.from("v_top_scorers").select("*")
      if (!scorersError && scorersData) topScorers = scorersData
    } catch {}

    try {
      const { data: assistsData, error: assistsError } = await supabase.from("v_top_assists").select("*")
      if (!assistsError && assistsData) topAssists = assistsData
    } catch {}

    try {
      const { data: disciplineData, error: disciplineError } = await supabase.from("v_discipline").select("*")
      if (!disciplineError && disciplineData) discipline = disciplineData
    } catch {}

    const stats = { goals: 0, assists: 0, yellow: 0, red: 0, wins: 0, draws: 0, losses: 0 }

    return NextResponse.json({
      topScorers: topScorers || [],
      topAssists: topAssists || [],
      discipline: discipline || [],
      ...stats,
    })
  } catch (error) {
    return NextResponse.json({ goals: 0, assists: 0, yellow: 0, red: 0, wins: 0, draws: 0, losses: 0 })
  }
}
