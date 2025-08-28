// Basic club badge mapping. Extend as needed.
export const TEAM_BADGES: Record<string, string> = {
  "arsenal": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
  "chelsea": "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
  "liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  "manchester city": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
  "manchester united": "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
  "tottenham hotspur": "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
  "newcastle united": "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg",
  "fc barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "real madrid": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
  "paris saint-germain": "https://upload.wikimedia.org/wikipedia/en/b/be/Paris_Saint-Germain_F.C..svg",
  "bayern munich": "https://upload.wikimedia.org/wikipedia/en/1/1f/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
}

const SYNONYMS: Record<string, string> = {
  "man city": "manchester city",
  "mancity": "manchester city",
  "man united": "manchester united",
  "man utd": "manchester united",
  "spurs": "tottenham hotspur",
  "psg": "paris saint-germain",
  "bayern": "bayern munich",
  "barcelona": "fc barcelona",
}

function normalizeTeamName(name?: string | null): string {
  if (!name) return ""
  const raw = name.toLowerCase().trim()
  if (SYNONYMS[raw]) return SYNONYMS[raw]
  // Strip dots/commas and collapse spaces
  const cleaned = raw.replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, " ").trim()
  if (SYNONYMS[cleaned]) return SYNONYMS[cleaned]
  return cleaned
}

export function getTeamBadge(team?: string | null): string | null {
  const key = normalizeTeamName(team)
  if (!key) return null
  if (TEAM_BADGES[key]) return TEAM_BADGES[key]
  return null
}

