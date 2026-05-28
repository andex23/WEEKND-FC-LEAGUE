import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from("league_settings").select("*").limit(1).maybeSingle()

    if (error) throw error

    const { data: tournament } = await admin
      .from("tournaments")
      .select("config")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()

    const stored = tournament?.config?.admin_settings || {}
    const branding = { ...(stored.branding || {}), ...(data?.branding || {}) }
    const socials = { ...(stored.socials || {}), ...(data?.socials || {}) }

    return NextResponse.json({
      branding: {
        leagueName: branding.league_name || data?.season_name || "Weekend FC League",
        logoUrl: branding.logo_url || "/logo.png",
        rulesUrl: branding.rules_url || "/rules",
        discordInviteUrl: branding.discord_invite_url || "",
      },
      socials: {
        telegramGroupUrl: socials.telegram_group_url || process.env.NEXT_PUBLIC_TELEGRAM_GROUP_URL || "",
        whatsappGroupUrl: socials.whatsapp_group_url || "",
        instagramUrl: socials.instagram_url || "",
        tiktokUrl: socials.tiktok_url || "",
        youtubeUrl: socials.youtube_url || "",
        xUrl: socials.x_url || "",
      },
    })
  } catch {
    return NextResponse.json({
      branding: {
        leagueName: "Weekend FC League",
        logoUrl: "/logo.png",
        rulesUrl: "/rules",
        discordInviteUrl: "",
      },
      socials: {
        telegramGroupUrl: process.env.NEXT_PUBLIC_TELEGRAM_GROUP_URL || "",
        whatsappGroupUrl: "",
        instagramUrl: "",
        tiktokUrl: "",
        youtubeUrl: "",
        xUrl: "",
      },
    })
  }
}
