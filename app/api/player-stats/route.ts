import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if views exist by trying to query them, return empty arrays if they don't exist
    let topScorers = []
    let topAssists = []
    let discipline = []

    // Try to fetch top scorers
    try {
      const { data: scorersData, error: scorersError } = await supabase.from("v_top_scorers").select("*")
      if (!scorersError && scorersData) {
        topScorers = scorersData
      }
    } catch (error) {
      console.log("[v0] Top scorers view not found, using empty array")
    }

    // Try to fetch top assists
    try {
      const { data: assistsData, error: assistsError } = await supabase.from("v_top_assists").select("*")
      if (!assistsError && assistsData) {
        topAssists = assistsData
      }
    } catch (error) {
      console.log("[v0] Top assists view not found, using empty array")
    }

    // Try to fetch discipline
    try {
      const { data: disciplineData, error: disciplineError } = await supabase.from("v_discipline").select("*")
      if (!disciplineError && disciplineData) {
        discipline = disciplineData
      }
    } catch (error) {
      console.log("[v0] Discipline view not found, using empty array")
    }

    return NextResponse.json({
      topScorers,
      topAssists,
      discipline,
    })
  } catch (error) {
    console.error("Error in player stats API:", error)
    return NextResponse.json({
      topScorers: [],
      topAssists: [],
      discipline: [],
    })
  }
}
