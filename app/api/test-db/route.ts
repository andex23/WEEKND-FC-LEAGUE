import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("Testing database connection...")
    
    const client = await createClient()
    console.log("Client created successfully")
    
    // Test a simple query
    const { data, error } = await client.from("players").select("count").limit(1)
    
    if (error) {
      console.error("Database query error:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code 
      })
    }
    
    console.log("Database query successful:", data)
    return NextResponse.json({ 
      success: true, 
      message: "Database connection working",
      data: data 
    })
    
  } catch (error) {
    console.error("Test endpoint error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
