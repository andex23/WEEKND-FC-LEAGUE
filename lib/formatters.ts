export function formatDateTime(dt?: string | Date) {
  if (!dt) return "—"
  const d = typeof dt === "string" ? new Date(dt) : dt
  return d.toLocaleString()
}

export function formatRecord(w?: number, d?: number, l?: number) {
  return `${w ?? 0}–${d ?? 0}–${l ?? 0}`
}

export function resultPill(result?: "W" | "D" | "L") {
  if (!result) return { text: "-", className: "bg-gray-100 text-gray-700 border-gray-200" }
  if (result === "W") return { text: "W", className: "bg-green-100 text-green-800 border-green-200" }
  if (result === "D") return { text: "D", className: "bg-amber-100 text-amber-800 border-amber-200" }
  return { text: "L", className: "bg-red-100 text-red-800 border-red-200" }
}
