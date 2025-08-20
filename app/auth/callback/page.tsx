import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const code = searchParams.code

  if (code) {
    const supabase = createServerClient()
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code)
    }
  }

  redirect("/")
}
