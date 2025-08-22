import { NextResponse } from "next/server"
import { __setMemPlayers } from "../players/route"

export async function POST() {
  const now = new Date().toISOString()
  const sample = [
    { id: 1, name: "Alex Rodriguez", psn_name: "CR7_Alex99", location: "London, UK", console: "PS5", preferred_club: "Man United", status: "pending", created_at: now },
    { id: 2, name: "Jordan Smith", psn_name: "MessiKing10", location: "Manchester, UK", console: "XBOX", preferred_club: "Man City", status: "pending", created_at: now },
    { id: 3, name: "Sam Wilson", psn_name: "BluesSam", location: "Birmingham, UK", console: "PS5", preferred_club: "Chelsea", status: "pending", created_at: now },
    { id: 4, name: "Ryan Taylor", psn_name: "ArsenalRyan", location: "London, UK", console: "PC", preferred_club: "Arsenal", status: "pending", created_at: now },
    { id: 5, name: "Mike Johnson", psn_name: "LFC_Mike", location: "Liverpool, UK", console: "PS5", preferred_club: "Liverpool", status: "pending", created_at: now },
    { id: 6, name: "Tom Brown", psn_name: "SpursTom", location: "London, UK", console: "XBOX", preferred_club: "Spurs", status: "pending", created_at: now },
    { id: 7, name: "Jake Davis", psn_name: "WHU_Jake", location: "London, UK", console: "PS5", preferred_club: "West Ham", status: "pending", created_at: now },
    { id: 8, name: "Chris Evans", psn_name: "Villa_Chris", location: "Birmingham, UK", console: "PC", preferred_club: "Aston Villa", status: "pending", created_at: now },
  ]

  __setMemPlayers(sample)
  return NextResponse.json({ ok: true, players: sample })
}
