export function downloadCSVFromObjects(filename: string, rows: Record<string, unknown>[]) {
  if (!Array.isArray(rows) || rows.length === 0) return

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k))
      return set
    }, new Set<string>())
  )

  const escapeCell = (val: unknown): string => {
    if (val == null) return ""
    const s = String(val)
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const csv = [headers.join(",")]
  for (const row of rows) {
    csv.push(headers.map((h) => escapeCell((row as any)[h])).join(","))
  }

  const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

