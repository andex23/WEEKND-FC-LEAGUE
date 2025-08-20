"use server"

import { createServerClient } from "@/lib/supabase/server"
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

  const supabase = createServerClient()
  if (!supabase) {
    return { error: "Authentication service unavailable" }
  }

  try {
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("email")
      .eq("name", username.toString())
      .single()

    if (playerError || !player) {
      return { error: "Invalid username or password" }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: player.email,
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
  const password = formData.get("password")

  if (!username || !password) {
    return { error: "Username and password are required" }
  }

  const supabase = createServerClient()
  if (!supabase) {
    return { error: "Authentication service unavailable" }
  }

  try {
    const { data: existingPlayer } = await supabase
      .from("players")
      .select("id")
      .eq("name", username.toString())
      .single()

    if (existingPlayer) {
      return { error: "Username already taken" }
    }

    const generatedEmail = `${username.toString().toLowerCase()}@eafc-league.local`

    const { data: authData, error } = await supabase.auth.signUp({
      email: generatedEmail,
      password: password.toString(),
      options: {
        data: {
          username: username.toString(),
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (authData.user) {
      const { error: playerError } = await supabase.from("players").insert({
        id: authData.user.id,
        name: username.toString(),
        email: generatedEmail,
        console: "PS5", // Default console
        preferred_club: "Arsenal", // Default club
      })

      if (playerError) {
        console.error("Player creation error:", playerError)
        return { error: "Account created but profile setup failed" }
      }
    }

    return { success: "Account created successfully! You can now sign in." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = createServerClient()
  if (supabase) {
    await supabase.auth.signOut()
  }
  redirect("/auth/login")
}
