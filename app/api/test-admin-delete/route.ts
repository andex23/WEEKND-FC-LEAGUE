import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id } = body
    
    console.log("Testing admin client delete for ID:", id)
    
    const admin = createAdminClient()
    console.log("Admin client created successfully")
    
    // Test delete with admin client
    const { error } = await admin.from("players").delete().eq("id", id)
    
    if (error) {
      console.error("Admin client delete error:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code 
      })
    }
    
    console.log("Admin client delete successful")
    return NextResponse.json({ 
      success: true, 
      message: "Admin client delete working"
    })
    
  } catch (error) {
    console.error("Admin client delete test error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
