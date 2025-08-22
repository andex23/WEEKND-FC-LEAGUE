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

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const username = formData.get("username")
  const name = formData.get("name")
  const psnId = formData.get("psnId")
  const location = formData.get("location")
  const console = formData.get("console")
  const preferredClub = formData.get("preferredClub")
  const password = formData.get("password")

  if (!username || !name || !psnId || !location || !console || !preferredClub || !password) {
    return { error: "All fields are required" }
  }

  const supabase = await createClient()

  try {
    // Check if username is already taken
    const { data: existingPlayer } = await supabase
      .from("players")
      .select("id")
      .eq("username", username.toString())
      .single()

    if (existingPlayer) {
      return { error: "Username already taken" }
    }

    const generatedEmail = `${username.toString().toLowerCase()}@weekndfc.local`

    // Create auth user
    const { data: authData, error } = await supabase.auth.signUp({
      email: generatedEmail,
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
        data: {
          username: username.toString(),
          name: name.toString(),
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (authData.user) {
      // Create player profile
      const { error: playerError } = await supabase.from("players").insert({
        id: authData.user.id,
        username: username.toString(),
        name: name.toString(),
        psn_id: psnId.toString(),
        location: location.toString(),
        console: console.toString() as "PS5" | "XBOX" | "PC",
        preferred_club: preferredClub.toString(),
      })

      if (playerError) {
        console.error("Player creation error:", playerError)
        return { error: "Account created but profile setup failed" }
      }
    }

    return { success: "Registration successful! You can now sign in." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
