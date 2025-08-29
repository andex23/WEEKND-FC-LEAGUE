import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const admin = createAdminClient()
    
    // Test 1: Check if fixtures table exists
    const { data: tableExists, error: tableError } = await admin
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "fixtures")
      .single()
    
    if (tableError) {
      console.error("Error checking if fixtures table exists:", tableError)
    }
    
    // Test 2: Get table structure
    const { data: columns, error: columnsError } = await admin
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_schema", "public")
      .eq("table_name", "fixtures")
      .order("ordinal_position")
    
    if (columnsError) {
      console.error("Error getting table structure:", columnsError)
    }
    
    // Test 3: Try to insert a test fixture
    const testFixture = {
      id: crypto.randomUUID(),
      tournament_id: "8a156f33-7ff4-4cca-ad49-5dcfd9f1a5fe",
      matchday: 1,
      home_player_id: "91c1f1e4-79a6-4085-875e-48facd411eec",
      away_player_id: "48204b9a-000f-42c9-850f-0e9bbf292da0",
      home_score: null,
      away_score: null,
      status: "SCHEDULED",
      scheduled_date: new Date().toISOString(),
    }
    
    console.log("Attempting to insert test fixture:", JSON.stringify(testFixture, null, 2))
    
    const { data: inserted, error: insertError } = await admin
      .from("fixtures")
      .insert([testFixture])
      .select()
      .single()
    
    if (insertError) {
      console.error("Error inserting test fixture:", insertError)
      console.error("Error details:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
    }
    
    // Test 4: Try to select fixtures
    const { data: fixtures, error: selectError } = await admin
      .from("fixtures")
      .select("*")
      .limit(5)
    
    if (selectError) {
      console.error("Error selecting fixtures:", selectError)
    }
    
    return NextResponse.json({
      tableExists: !!tableExists,
      columns: columns || [],
      insertTest: {
        success: !insertError,
        error: insertError ? {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        } : null,
        data: inserted
      },
      selectTest: {
        success: !selectError,
        error: selectError ? {
          code: selectError.code,
          message: selectError.message,
          details: selectError.details,
          hint: selectError.hint
        } : null,
        count: fixtures?.length || 0,
        data: fixtures
      }
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
