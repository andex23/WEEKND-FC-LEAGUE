import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LoginForm from "@/components/auth/login-form"
import { BackgroundVideo } from "@/components/background-video"
import { safeNextPath } from "@/lib/safe-next-path"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const { next } = await searchParams
  const postLoginPath = safeNextPath(next)

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      redirect(postLoginPath)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 py-12">
      <BackgroundVideo />

      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
