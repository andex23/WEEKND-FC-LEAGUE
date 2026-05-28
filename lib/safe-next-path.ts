export function safeNextPath(value: string | string[] | undefined, fallback = "/dashboard"): string {
  const next = Array.isArray(value) ? value[0] : value
  if (!next) return fallback
  if (!next.startsWith("/") || next.startsWith("//")) return fallback
  return next
}
