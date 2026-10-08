export function discordInvite(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return null
    const match = url.hostname === 'discord.gg' ? url.pathname.match(/^\/([A-Za-z0-9_-]+)\/?$/)
      : url.hostname === 'discord.com' ? url.pathname.match(/^\/invite\/([A-Za-z0-9_-]+)\/?$/) : null
    if (!match || match[1] === 'YZumc42p') return null
    return `${url.origin}${url.pathname}`
  } catch { return null }
}
