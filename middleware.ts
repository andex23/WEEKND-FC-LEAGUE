import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PUBLIC_ADMIN_GETS = new Set([
  "/api/admin/settings",
  "/api/admin/tournaments",
  "/api/admin/players",
])

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Admin area uses a separate cookie-based gate.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const isAdmin = request.cookies.get("wfc_admin")?.value === "1"
    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Privileged API routes require the admin cookie. Public pages still read a
  // few admin GET endpoints, so those stay open; everything else is gated.
  // /api/admin/auth is the admin login endpoint itself — it must stay public,
  // otherwise the cookie it issues could never be obtained in the first place.
  const isWrite = request.method !== "GET" && request.method !== "HEAD"
  const needsAdmin =
    (pathname.startsWith("/api/admin/") &&
      pathname !== "/api/admin/auth" &&
      !(!isWrite && PUBLIC_ADMIN_GETS.has(pathname))) ||
    (pathname === "/api/fixtures" && isWrite) ||
    ((pathname === "/api/tournament/publish" || pathname === "/api/tournament/config") && isWrite)

  if (needsAdmin && request.cookies.get("wfc_admin")?.value !== "1") {
    return NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 })
  }

  // Player area uses the Supabase session; updateSession also refreshes cookies.
  return updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
