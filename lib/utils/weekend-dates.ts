/** Friday–Sunday matchdays, at 17:00 Africa/Lagos (UTC+1), independent of server timezone. */
export function computeWeekendDates(
  startAt: string | null,
  count: number,
  matchdaysPerWeekend = 3,
): string[] {
  if (![1, 2, 3].includes(matchdaysPerWeekend))
    throw new Error("Choose 1, 2 or 3 matchdays per weekend")
  const start = startAt ? new Date(startAt) : new Date()
  if (!Number.isFinite(start.getTime())) throw new Error("Invalid tournament start date")
  const local = new Date(start.getTime() + 60 * 60 * 1000)
  const date = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 16),
  )
  const dates: string[] = []
  let used = 0
  while (dates.length < count) {
    const day = date.getUTCDay()
    if (day === 1) used = 0
    if ([5, 6, 0].includes(day) && used < matchdaysPerWeekend && date >= start) {
      dates.push(date.toISOString())
      used++
    }
    date.setUTCDate(date.getUTCDate() + 1)
  }
  return dates
}
