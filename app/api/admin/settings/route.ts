import { NextResponse } from "next/server"

// Global settings memory so other routes can read active tournament id
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any
if (!g.__adminSettings) {
  g.__adminSettings = {
    tournament: { name: "", slug: "", status: "DRAFT", format: "DOUBLE", match_length: 8, allowed_consoles: ["PS5"], clubs_only: false, max_players: null, reg_start_at: null, reg_end_at: null, tiebreakers: ["POINTS","GD","GF","H2H","COIN"], dc_threshold: 20, dc_rule: "threshold", forfeit_default: "3-0", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, matchdays: ["Sat","Sun"], kickoff_slots: ["15:00","18:00","21:00"], options: { allow_bye: true, even_only: false, home_away_balance: true }, active_tournament_id: null },
    branding: { logo_url: "", accent_color: "#00C853", dark_mode: true, rules_url: "", discord_invite_url: "", league_name: "Weekend FC" },
    integrations: { discord_webhook_url: "", discord_events: { approve:true, fixture:true, result:true, rule:true }, email_provider: "none", email_from_name: "Weekend FC", email_from_address: "noreply@example.com", templates_json: {}, google_form_map: {} },
    permissions: { members: [], role_caps: {} },
    rules: { body: "", versions: [] as any[], published: false },
    advanced: { api_tokens: [], webhooks: [], slugs: {} },
  }
}
let memory: any = g.__adminSettings

export async function GET() { return NextResponse.json(memory) }

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { section, data } = body
  if (!section) return NextResponse.json({ ok:false, error:"missing section" }, { status:400 })
  const next = { ...memory[section], ...data }
  // If tournament status not ACTIVE, clear active id
  if (section === "tournament") {
    if (String(next.status || "").toUpperCase() !== "ACTIVE") {
      next.active_tournament_id = null
    }
  }
  memory = { ...memory, [section]: next }
  g.__adminSettings = memory
  return NextResponse.json({ ok:true, [section]: memory[section] })
}
