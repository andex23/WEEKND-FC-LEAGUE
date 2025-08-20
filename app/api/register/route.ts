import { type NextRequest, NextResponse } from "next/server"
import { registrationSchema } from "@/lib/validations"
import { createPlayer, getLeagueSettings } from "@/lib/supabase/queries"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    const validatedData = registrationSchema.parse(body)

    const leagueSettings = await getLeagueSettings()
    if (leagueSettings?.status !== "DRAFT") {
      return NextResponse.json({ error: "Registration is closed. League has already started." }, { status: 400 })
    }

    const player = await createPlayer({
      name: validatedData.name,
      location: validatedData.location,
      console: validatedData.console,
      preferred_club: validatedData.preferredClub,
    })

    return NextResponse.json(
      {
        message: "Registration successful! You'll be notified when teams are assigned.",
        data: player,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof Error) {
      return NextResponse.json({ error: "Registration failed", details: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
