import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { readPlayerAccess } from "@/lib/security/player-access"

// Player-facing areas that require a signed-in Supabase session.
const PROTECTED_PREFIXES = ["/dashboard", "/report", "/refer"]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.search = `?next=${encodeURIComponent(pathname)}`
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  try {
    if (!isProtected) {
      await supabase.auth.getUser()
      return supabaseResponse
    }
    const access = await readPlayerAccess(supabase)
    if (!access.ok && access.status === 503) {
      return new NextResponse(access.error, { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } })
    }
    if (!access.ok) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.search = `?next=${encodeURIComponent(pathname)}&access=${encodeURIComponent(access.code)}`
      const redirect = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
      return redirect
    }
  } catch {
    // A session-provider outage must not take public pages down. Protected
    // pages still fail closed instead of continuing without authentication.
    if (isProtected) {
      return new NextResponse("Sign-in is temporarily unavailable. Please try again shortly.", {
        status: 503,
        headers: { "Retry-After": "30", "Cache-Control": "no-store" },
      })
    }
  }

  return supabaseResponse
}
