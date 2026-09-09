// Web Crypto keeps the same verifier usable in middleware and route handlers.
export const ADMIN_SESSION_SECONDS = 60 * 60 * 12

async function signingKey() {
  const password = process.env.ADMIN_PASSWORD?.trim()
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!password || !email) throw new Error("Admin login is not configured")
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JSON.stringify(["wfc-admin-session-v1", email, password])),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

export async function createAdminSession(now = Date.now()) {
  const expires = Math.floor(now / 1000) + ADMIN_SESSION_SECONDS
  const payload = `v1.${expires}.${crypto.randomUUID()}`
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), new TextEncoder().encode(payload))
  return `${payload}.${Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("")}`
}

export async function verifyAdminSession(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token || token.length > 200) return false
  const parts = token.split(".")
  if (parts.length !== 4) return false
  const [version, expires, nonce, signature] = parts
  if (version !== "v1" || !/^\d+$/.test(expires) || !/^[a-f0-9-]{36}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(signature)) return false
  const remaining = Number(expires) - Math.floor(now / 1000)
  if (remaining <= 0 || remaining > ADMIN_SESSION_SECONDS) return false
  try {
    return await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      Uint8Array.from(signature.match(/../g)!, (byte) => parseInt(byte, 16)),
      new TextEncoder().encode(parts.slice(0, 3).join(".")),
    )
  } catch {
    return false
  }
}
