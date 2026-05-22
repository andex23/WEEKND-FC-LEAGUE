import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams

  if (code) {
    const supabase = await createClient()
    try {
      // Supabase has already confirmed the email before this redirect; the
      // exchange just clears the PKCE code. Sign out so the account stays
      // gated behind the normal sign-in flow (which checks admin approval).
      await supabase.auth.exchangeCodeForSession(code)
      await supabase.auth.signOut()
    } catch {
      // A failed exchange is harmless — the email is confirmed regardless.
    }
    redirect("/auth/login?confirmed=1")
  }

  redirect("/auth/login")
}
