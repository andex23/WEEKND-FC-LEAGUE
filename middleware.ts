import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

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

  // Player area uses the Supabase session; updateSession also refreshes cookies.
  return updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
