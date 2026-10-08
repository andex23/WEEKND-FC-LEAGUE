import { createAdminSession, ADMIN_SESSION_SECONDS } from "@/lib/admin/session"
import { NextRequest, NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/security/rate-limit"

export async function POST(req: NextRequest) {
  try {
    // Trim env values — a stray space or newline pasted into the dashboard
    // is the most common reason a correct password is rejected.
    const adminEmail = process.env.ADMIN_EMAIL?.trim()
    const adminPassword = process.env.ADMIN_PASSWORD?.trim()
    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { message: "Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD." },
        { status: 500 },
      )
    }

    const { email, password } = await req.json()
    const limit = await enforceRequestRateLimit("admin-login", req.headers, typeof email === "string" ? email : undefined)
    if (!limit.allowed) return NextResponse.json({ message: limit.error }, { status: limit.status, headers: { "Retry-After": String(limit.retryAfter) } })
    const emailMatch =
      typeof email === "string" && email.trim().toLowerCase() === adminEmail.toLowerCase()
    const passwordMatch = typeof password === "string" && password === adminPassword
    if (emailMatch && passwordMatch) {
      const res = NextResponse.json({ ok: true })
      // Set secure httpOnly cookie for admin gate
      res.cookies.set({
        name: "wfc_admin",
        value: await createAdminSession(),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_SESSION_SECONDS,
      })
      return res
    }
    return NextResponse.json(
      {
        message: "Incorrect email or password.",
      },
      { status: 401 },
    )
  } catch (e) {
    return NextResponse.json({ message: "Bad request" }, { status: 400 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({ name: "wfc_admin", value: "", path: "/", maxAge: 0 })
  return res
}


