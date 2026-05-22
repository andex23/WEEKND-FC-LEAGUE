import { NextRequest, NextResponse } from "next/server"

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
    const emailMatch =
      typeof email === "string" && email.trim().toLowerCase() === adminEmail.toLowerCase()
    const passwordMatch = typeof password === "string" && password === adminPassword
    if (emailMatch && passwordMatch) {
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
    return NextResponse.json(
      {
        message: !emailMatch
          ? "That email doesn't match the admin email configured in Vercel."
          : "Email is correct, but the password doesn't match. Re-check the ADMIN_PASSWORD value in Vercel — watch for surrounding quotes or extra characters.",
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


