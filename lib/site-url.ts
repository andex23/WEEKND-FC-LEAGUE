function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "")
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function siteOrigin(requestUrl?: string): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL

  if (configured) return normalizeBaseUrl(configured)
  if (requestUrl) return new URL(requestUrl).origin
  return "http://localhost:3000"
}

export function absoluteUrl(path: string, requestUrl?: string): string {
  return new URL(path, `${siteOrigin(requestUrl)}/`).toString()
}
