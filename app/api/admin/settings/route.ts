import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const DEFAULT_SETTINGS = {
  tournament: {
    name: "Weekend FC League",
    status: "DRAFT",
    matchdays: ["Sat", "Sun"],
    match_length: 8,
  },
  branding: {
    league_name: "Weekend FC League",
    logo_url: "/logo.png",
    accent_color: "#10b981",
    dark_mode: true,
    rules_url: "/rules",
    discord_invite_url: "",
  },
  socials: {
    telegram_group_url: process.env.NEXT_PUBLIC_TELEGRAM_GROUP_URL || "https://t.me/weekendfc",
    whatsapp_group_url: "",
    instagram_url: "",
    tiktok_url: "",
    youtube_url: "",
    x_url: "",
  },
  integrations: {
    discord_webhook_url: "",
    email_from_name: process.env.SMTP_FROM_NAME || "Weekend FC League",
    email_from_address: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  },
  general: {},
}

function withDefaults(row: any) {
  const stored = row?.stored || {}
  const leagueName = row?.branding?.league_name || stored?.branding?.league_name || row?.season_name || DEFAULT_SETTINGS.branding.league_name
  return {
    ...(row || {}),
    tournament: {
      ...DEFAULT_SETTINGS.tournament,
      name: leagueName,
      status: row?.status || DEFAULT_SETTINGS.tournament.status,
      ...(stored?.tournament || {}),
      ...(row?.tournament || {}),
    },
    branding: {
      ...DEFAULT_SETTINGS.branding,
      league_name: leagueName,
      ...(stored?.branding || {}),
      ...(row?.branding || {}),
    },
    socials: {
      ...DEFAULT_SETTINGS.socials,
      ...(stored?.socials || {}),
      ...(row?.socials || {}),
    },
    integrations: {
      ...DEFAULT_SETTINGS.integrations,
      ...(stored?.integrations || {}),
      ...(row?.integrations || {}),
    },
    general: {
      ...DEFAULT_SETTINGS.general,
      ...(stored?.general || {}),
      ...(row?.general || {}),
    },
  }
}

async function loadSettings(client: ReturnType<typeof createAdminClient>) {
  const { data: league, error } = await client.from("league_settings").select("*").limit(1).maybeSingle()
  if (error) throw error

  const { data: tournament } = await client
    .from("tournaments")
    .select("id,config")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  const stored = tournament?.config?.admin_settings || {}
  return { row: { ...(league || {}), stored }, tournament }
}

function columnMissing(error: any) {
  return /column .* does not exist|schema cache|Could not find/i.test(String(error?.message || ""))
}

export async function GET() {
  try {
    const client = createAdminClient()
    const { row } = await loadSettings(client)
    return NextResponse.json(withDefaults(row))
  } catch (error) {
    console.error("Error loading settings:", error)
    return NextResponse.json(withDefaults(null))
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { section, data } = body
    const client = createAdminClient()

    // Load current
    const { row: current, tournament } = await loadSettings(client)
    let next = withDefaults(current)

    if (section && data) {
      next = { ...next, [section]: { ...(next as any)[section], ...data } }
      if (section === "tournament" && data?.active_tournament_id) {
        next.active_tournament_id = data.active_tournament_id
      }
    } else {
      next = { ...next, ...body }
    }

    if (next?.branding?.league_name) next.season_name = next.branding.league_name
    if (next?.tournament?.status) next.status = next.tournament.status

    const sections = {
      tournament: next.tournament,
      branding: next.branding,
      socials: next.socials,
      integrations: next.integrations,
      general: next.general,
    }

    if (tournament?.id) {
      await client
        .from("tournaments")
        .update({ config: { ...(tournament.config || {}), admin_settings: sections } })
        .eq("id", tournament.id)
    }

    const basePatch = {
      season_name: next.season_name,
      status: next.status,
    }
    const jsonPatch = {
      ...basePatch,
      ...sections,
    }

    let saved = current
    if (current?.id) {
      const hasJsonColumns = ["tournament", "branding", "socials", "integrations", "general"].some((key) =>
        Object.prototype.hasOwnProperty.call(current, key),
      )
      const shouldUpdateBase = section === "tournament" || section === "branding" || !section

      if (!hasJsonColumns) {
        if (shouldUpdateBase) {
          const { data: savedBase, error: baseError } = await client
            .from("league_settings")
            .update(basePatch)
            .eq("id", current.id)
            .select()
            .single()
          if (baseError) throw baseError
          saved = { ...(savedBase || {}), stored: sections }
        }
      } else {
        const { data: savedJson, error: jsonError } = await client
          .from("league_settings")
          .update(jsonPatch)
          .eq("id", current.id)
          .select()
          .single()

        if (jsonError && columnMissing(jsonError) && shouldUpdateBase) {
          const { data: savedBase, error: baseError } = await client
            .from("league_settings")
            .update(basePatch)
            .eq("id", current.id)
            .select()
            .single()
          if (baseError) throw baseError
          saved = { ...(savedBase || {}), stored: sections }
        } else if (jsonError && columnMissing(jsonError)) {
          saved = { ...current, stored: sections }
        } else if (jsonError) {
          throw jsonError
        } else {
          saved = savedJson
        }
      }
    }

    return NextResponse.json({ success: true, settings: withDefaults({ ...(saved || {}), stored: sections }) })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
