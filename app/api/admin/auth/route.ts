import { NextRequest, NextResponse } from "next/server"

// Hardcoded admin credentials per user request
const ADMIN_EMAIL = "blondealonee@gmail.com"
const ADMIN_PASSWORD = "Sini1234"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const res = NextResponse.json({ ok: true })
      // Set secure httpOnly cookie for admin gate
      res.cookies.set({
        name: "wfc_admin",
        value: "1",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12, // 12 hours
      })
      return res
    }
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
  } catch (e) {
    return NextResponse.json({ message: "Bad request" }, { status: 400 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({ name: "wfc_admin", value: "", path: "/", maxAge: 0 })
  return res
}


