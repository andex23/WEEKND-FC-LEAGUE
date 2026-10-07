import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LoginForm from "@/components/auth/login-form"
import { Pitch } from "@/components/league/ui"
import { safeNextPath } from "@/lib/safe-next-path"
import { readPlayerAccess } from "@/lib/security/player-access"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const { next } = await searchParams
  const postLoginPath = safeNextPath(next)
  let accessError: string | undefined

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const access = await readPlayerAccess(supabase)
    if (access.ok) {
      redirect(postLoginPath)
    }
    if (!access.ok && access.status !== 401) accessError = access.error
  }

  return (
    <div className="fc-form-page">
      <div className="fc-wrap fc-login-layout">
        <aside className="fc-login-story">
          <img src="/weekend-ball.jpg" alt="" />
          <h2>
            Your weekend
            <br />
            starts here.
          </h2>
        </aside>
        <div className="fc-login-panel">
          <LoginForm initialError={accessError} />
        </div>
      </div>
    </div>
  )
}
