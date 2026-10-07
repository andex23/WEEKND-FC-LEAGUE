import { redirect } from "next/navigation"

export default async function AuthCallback({ searchParams }: { searchParams: Promise<{ code?: string; next?: string }> }) {
  const { code, next } = await searchParams
  if (!code) redirect("/auth/login")
  if (next === "/auth/reset-password") {
    // Let the browser client exchange PKCE so the resulting cookies are saved.
    // Server Components cannot persist cookies during this code exchange.
    redirect(`/auth/reset-password#${new URLSearchParams({ code }).toString()}`)
  }
  // A GET must not consume a confirmation code (mail scanners follow links).
  // The landing page requires a deliberate POST and reports failures honestly.
  redirect(`/auth/verify-email#${new URLSearchParams({ code }).toString()}`)
}
