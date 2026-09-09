export type StatsRow = { id: string; name: string; team: string; [key: string]: any }
export const statsFields: Record<string, string[]> = {
  standings: ["P", "W", "D", "L", "GF", "GA", "GD", "Pts"],
  scorers: ["G"], assists: ["A"], discipline: ["YC", "RC"],
}

export function mergeStatsRows(base: StatsRow[], overrides: Record<string, any> = {}, table: string): StatsRow[] {
  const rows = new Map(base.map((row) => [row.id, { ...row }]))
  for (const [id, patch] of Object.entries(overrides)) {
    if (patch.deleted) { rows.delete(id); continue }
    const row = rows.get(id) || { id, name: "", team: "-", ...Object.fromEntries((statsFields[table] || []).map((f) => [f, 0])) }
    rows.set(id, { ...row, ...patch, id, overridden: Object.fromEntries(Object.keys(patch).map((key) => [key, true])) })
  }
  return [...rows.values()].filter((row) => row.name)
}

export function csvCell(value: unknown): string {
  const text = String(value ?? "")
  return `"${(/^[=+@-]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`
}
