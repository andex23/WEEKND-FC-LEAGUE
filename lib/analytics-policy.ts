const PRIVATE_PATHS = ['/auth', '/admin', '/dashboard', '/report', '/refer', '/api']
const privatePath = (path: string) => PRIVATE_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
export const shouldTrackPage = (host: string, path: string) =>
  ['weekendfc.site', 'www.weekendfc.site'].includes(host) && !privatePath(path)

export function cleanReferrer(value: string): string {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || privatePath(url.pathname)) return ''
    return `${url.origin}${url.pathname}`
  } catch { return '' }
}
