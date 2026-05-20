"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const username = formData.get("username")
  const password = formData.get("password")

  if (!username || !password) {
    return { error: "Username and password are required" }
  }

  const supabase = await createClient()

  try {
    // Look up player by username to get their generated email
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id")
      .eq("username", username.toString())
      .single()

    if (playerError || !player) {
      return { error: "Invalid username or password" }
    }

    // Generate the same email format used during signup
    const generatedEmail = `${username.toString().toLowerCase()}@weekndfc.local`

    const { error } = await supabase.auth.signInWithPassword({
      email: generatedEmail,
      password: password.toString(),
    })

    if (error) {
      return { error: "Invalid username or password" }
    }

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
