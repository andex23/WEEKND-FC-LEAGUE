import { getTransporter, emailFrom } from "./client"

/** Send a single email. Returns false (without throwing) if it could not be sent. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn(`[email] SMTP not configured — skipped "${subject}" to ${to}`)
    return false
  }
  try {
    await transporter.sendMail({ from: emailFrom(), to, subject, html })
    return true
  } catch (error) {
    console.error(`[email] failed to send "${subject}":`, error instanceof Error ? error.message : error)
    return false
  }
}

/**
 * Send the same email to many recipients in one go, BCC'd so addresses stay
 * private. Returns the number of recipients it was delivered to.
 */
export async function sendBroadcast(recipients: string[], subject: string, html: string): Promise<number> {
  const valid = Array.from(new Set(recipients.filter((r) => r && r.includes("@"))))
  const transporter = getTransporter()
  if (!transporter) {
    console.warn(`[email] SMTP not configured — skipped broadcast "${subject}"`)
    return 0
  }
  if (valid.length === 0) return 0
  try {
    await transporter.sendMail({ from: emailFrom(), to: emailFrom(), bcc: valid, subject, html })
    return valid.length
  } catch (error) {
    console.error(`[email] broadcast "${subject}" failed:`, error instanceof Error ? error.message : error)
    return 0
  }
}
