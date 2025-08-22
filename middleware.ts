import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Protect admin route: allow if demo cookie grants ADMIN
  if (pathname.startsWith("/admin")) {
    const role = request.cookies.get("wfc_demo_role")?.value
    if (role !== "ADMIN") {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
