import nodemailer, { type Transporter } from "nodemailer"

let cached: Transporter | null = null

/**
 * Nodemailer transport built from the SMTP_* environment variables, or null
 * when they are not configured (so email is skipped instead of crashing).
 */
export function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  if (cached) return cached

  const port = Number(process.env.SMTP_PORT) || 465
  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // Pooled so bulk sends reuse a few connections instead of opening dozens.
    pool: true,
    maxConnections: 3,
  })
  return cached
}

/** The "Weekend FC League <address>" sender header. */
export function emailFrom(): string {
  const name = process.env.SMTP_FROM_NAME || "Weekend FC League"
  const address = process.env.SMTP_FROM || process.env.SMTP_USER || ""
  return `${name} <${address}>`
}

/** True when the SMTP_* environment variables needed to send mail are set. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}
