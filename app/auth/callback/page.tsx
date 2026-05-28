import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>
}) {
  const { code, next } = await searchParams
  const nextPath =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null

  if (code) {
    const supabase = await createClient()
    let exchanged = false

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
      exchanged = true
    } catch {
      // A failed exchange usually means the link expired or was already used.
    }

    if (nextPath === "/auth/reset-password") {
      redirect(exchanged ? nextPath : "/auth/forgot-password")
    }

    // Email confirmation links should not leave the user signed in. The
    // normal sign-in flow still enforces admin approval.
    if (exchanged) await supabase.auth.signOut()
    redirect("/auth/confirmed")
  }

  redirect("/auth/login")
}
