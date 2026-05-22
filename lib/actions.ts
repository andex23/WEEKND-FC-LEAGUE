"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Please enter your email and password." }
  }

  const supabase = await createClient()

  try {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: email.toString().toLowerCase(),
      password: password.toString(),
    })

    if (error) {
      console.warn("Sign-in failed:", error.status, error.code, error.message)
      const code = error.code ?? ""
      const message = (error.message ?? "").toLowerCase()

      if (code === "email_not_confirmed" || message.includes("not confirmed")) {
        return {
          error: "Your email isn't confirmed yet. Check your inbox for the verification link, then sign in.",
        }
      }
      if (code === "invalid_credentials" || message.includes("invalid login")) {
        return { error: "That email and password don't match. Double-check and try again." }
      }
      if (error.status === 429 || code.includes("rate_limit")) {
        return { error: "Too many sign-in attempts. Please wait a minute, then try again." }
      }
      return { error: error.message || "We couldn't sign you in. Please try again." }
    }

    // Email is confirmed (Supabase blocks unconfirmed sign-ins above). Now
    // enforce the admin-approval gate before letting the player through.
    const userId = signInData.user?.id
    if (userId) {
      const { data: player } = await supabase
        .from("players")
        .select("status, role")
        .eq("id", userId)
        .maybeSingle()

      if (player && player.role !== "ADMIN" && player.status !== "approved") {
        await supabase.auth.signOut()
        if (player.status === "rejected") {
          return {
            error: "Your registration wasn't approved. Reach out to an admin if you think this is a mistake.",
          }
        }
        return {
          error: "Your account is awaiting admin approval. You'll be able to sign in once an admin clears you.",
        }
      }
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
