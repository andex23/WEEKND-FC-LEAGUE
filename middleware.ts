import { verifyAdminSession } from "@/lib/admin/session"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Admin area uses a separate cookie-based gate.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const isAdmin = await verifyAdminSession(request.cookies.get("wfc_admin")?.value)
    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Admin APIs are private. Public pages use separate, limited read endpoints.
  const isWrite = request.method !== "GET" && request.method !== "HEAD"
  const needsAdmin =
    (pathname.startsWith("/api/admin/") &&
      pathname !== "/api/admin/auth") ||
    pathname === "/api/tournament/config" ||
    ((pathname === "/api/fixtures" || pathname === "/api/league/status") && isWrite) ||
    ((pathname === "/api/tournament/publish" || pathname === "/api/tournament/config") && isWrite)

  if (needsAdmin && !(await verifyAdminSession(request.cookies.get("wfc_admin")?.value))) {
    return NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 })
  }

  // Player area uses the Supabase session; updateSession also refreshes cookies.
  return updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
