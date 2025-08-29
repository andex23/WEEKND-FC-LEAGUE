import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    console.log("Testing admin client...")
    
    const admin = createAdminClient()
    console.log("Admin client created successfully")
    
    // Test a simple query with admin client
    const { data, error } = await admin.from("players").select("count").limit(1)
    
    if (error) {
      console.error("Admin client query error:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code 
      })
    }
    
    console.log("Admin client query successful:", data)
    return NextResponse.json({ 
      success: true, 
      message: "Admin client working",
      data: data 
    })
    
  } catch (error) {
    console.error("Admin client test error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
