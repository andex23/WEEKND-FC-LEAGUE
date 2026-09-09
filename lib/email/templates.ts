// Branded HTML email templates for the Weekend FC League.
// Each builder returns a { subject, html } pair ready for the send helpers.

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  )
}

type Cta = { label: string; url: string }

function layout(opts: {
  heading: string
  intro: string
  bodyHtml?: string
  cta?: Cta
  footerNote?: string
}): string {
  const { heading, intro, bodyHtml, cta, footerNote } = opts
  const actionUrl = cta ? escapeHtml(cta.url) : ""
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/><title>Weekend FC</title>
<style>@media only screen and (max-width:600px){.mail-shell{padding:20px 12px!important}.mail-content{padding:32px 24px!important}.mail-heading{font-size:29px!important}.mail-logo{padding:30px 24px 20px!important}}</style></head>
<body style="margin:0;padding:0;background:#eeefec;color:#1c1e20;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${heading.replace(/<[^>]*>/g, "")} — your Weekend FC update.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eeefec;"><tr><td class="mail-shell" align="center" style="padding:48px 16px;">
<!--[if mso]><table role="presentation" width="560"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e1e3de;border-radius:4px;">
<tr><td class="mail-logo" align="center" style="padding:40px 40px 25px;"><a href="https://weekendfc.site" style="text-decoration:none;color:#111214;"><img src="https://weekendfc.site/logo.png" alt="Weekend FC" width="58" height="58" style="display:block;border:0;border-radius:50%;margin:0 auto 15px;"/><span style="font-size:16px;line-height:1.4;font-weight:700;letter-spacing:-.4px;">Weekend FC</span></a></td></tr>
<tr><td class="mail-content" style="padding:15px 44px 42px;">
<h1 class="mail-heading" style="margin:0 0 22px;text-align:center;font-size:34px;line-height:1.2;letter-spacing:-1.2px;font-weight:600;color:#111214;">${heading}</h1>
<p style="margin:0;font-size:15px;line-height:1.85;color:#5e6167;">${intro}</p>
${bodyHtml ? `<div style="margin-top:26px;">${bodyHtml}</div>` : ""}
${cta ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:32px auto 0;"><tr><td bgcolor="#d3ed9b" style="background:#d3ed9b;border-radius:5px;text-align:center;mso-padding-alt:15px 30px;"><a href="${actionUrl}" style="display:inline-block;padding:15px 30px;color:#171c10;text-decoration:none;font-size:14px;font-weight:600;line-height:20px;">${escapeHtml(cta.label)}</a></td></tr></table>` : ""}
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid #eceee8;background:#fafbf8;text-align:center;"><p style="margin:0;font-size:11px;line-height:1.8;color:#797d83;">${footerNote ? escapeHtml(footerNote) : "A message for your next Weekend FC matchday."}</p></td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
<p style="margin:25px 0 0;font-size:11px;line-height:1.8;color:#83878c;text-align:center;">Football for your weekends.<br/><a href="https://weekendfc.site" style="color:#555b61;text-decoration:none;">weekendfc.site</a></p>
</td></tr></table></body></html>`
}

export type EmailContent = { subject: string; html: string }

export function approvalConfirmedEmail(name: string, loginUrl: string): EmailContent {
  return {
    subject: "Welcome to Weekend FC — your registration is approved",
    html: layout({
      heading: "Welcome to the club.",
      intro: `Hi ${escapeHtml(
        name,
      )}, your Weekend FC registration is approved. Your account is ready. Sign in to check your tournament invitations and choose your club.`,
      cta: { label: "Sign in", url: loginUrl },
      footerNote: "You're receiving this because your Weekend FC League registration was approved.",
    }),
  }
}

export function passwordChangedEmail(name: string): EmailContent {
  return {
    subject: "Your Weekend FC League password was changed",
    html: layout({
      heading: "Password changed",
      intro: `Hi ${escapeHtml(name)}, the password for your Weekend FC League account was just changed. If this was you, you're all set — no further action is needed.`,
      footerNote:
        "Didn't change your password? Reset it immediately from the sign-in page and let an admin know.",
    }),
  }
}

export function passwordResetEmail(name: string, resetUrl: string): EmailContent {
  return {
    subject: "Reset your Weekend FC League password",
    html: layout({
      heading: "Reset your password",
      intro: `Hi ${escapeHtml(
        name,
      )}, use this secure link to choose a new password for your Weekend FC League account.`,
      cta: { label: "Reset password", url: resetUrl },
      footerNote: "If you didn't request a password reset, you can safely ignore this email.",
    }),
  }
}

export function announcementEmail(title: string, message: string): EmailContent {
  const paragraphs = message
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map(
      (p) =>
        `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#5e6167;">${escapeHtml(
          p.trim(),
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("")
  return {
    subject: title,
    html: layout({
      heading: escapeHtml(title),
      intro: "Here's the latest from the Weekend FC League:",
      bodyHtml: paragraphs,
      footerNote: "You're receiving this as a registered Weekend FC League player.",
    }),
  }
}

export type FixtureLine = {
  matchday: number
  dateLabel: string
  opponent: string
  isHome: boolean
  yourClub: string
  oppClub: string
}

export function fixturesEmail(
  name: string,
  fixtures: FixtureLine[],
  dashboardUrl: string,
): EmailContent {
  const rows = fixtures.length
    ? fixtures
        .map(
          (f) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e6e9e0;">
<span style="font-size:14px;color:#1c1e20;"><span style="color:#344124;font-weight:700;">MD${f.matchday}</span> &middot; ${escapeHtml(
            f.dateLabel,
          )}</span><br/>
<span style="color:#6a7077;font-size:13px;">${f.isHome ? "Home" : "Away"} vs ${escapeHtml(
            f.opponent,
          )} &middot; ${escapeHtml(f.yourClub)} v ${escapeHtml(f.oppClub)}</span>
</td></tr>`,
        )
        .join("")
    : `<tr><td style="padding:10px 0;font-size:14px;color:#6a7077;">No fixtures scheduled for you yet.</td></tr>`
  return {
    subject: "Your Weekend FC League fixtures",
    html: layout({
      heading: "Your fixtures are ready",
      intro: `Hi ${escapeHtml(name)}, here's your upcoming schedule. Check the dashboard for the latest times and to report results.`,
      bodyHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`,
      cta: { label: "View full schedule", url: dashboardUrl },
    }),
  }
}

export function matchReminderEmail(opts: {
  name: string
  opponent: string
  dateLabel: string
  isHome: boolean
  yourClub: string
  oppClub: string
  dashboardUrl: string
}): EmailContent {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;font-size:14px;color:#6a7077;">${label}</td><td style="padding:6px 0;font-size:14px;color:#1c1e20;text-align:right;font-weight:700;">${escapeHtml(
      value,
    )}</td></tr>`
  return {
    subject: `Upcoming match — vs ${opts.opponent}`,
    html: layout({
      heading: "Your next match awaits.",
      intro: `Hi ${escapeHtml(opts.name)}, this is a reminder about your upcoming Weekend FC League fixture.`,
      bodyHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("Opponent", opts.opponent)}
${row("When", opts.dateLabel)}
${row("Venue", opts.isHome ? "Home" : "Away")}
${row("Clubs", `${opts.yourClub} v ${opts.oppClub}`)}
</table>`,
      cta: { label: "Open dashboard", url: opts.dashboardUrl },
      footerNote: "Play your match, then report the score from your dashboard.",
    }),
  }
}

export function referralEmail(opts: {
  inviterName: string
  registerUrl: string
  note?: string
}): EmailContent {
  const noteHtml = opts.note?.trim()
    ? `<p style="margin:0;font-size:15px;line-height:1.6;color:#5e6167;font-style:italic;">&ldquo;${escapeHtml(
        opts.note.trim(),
      )}&rdquo;</p>`
    : ""
  return {
    subject: `${opts.inviterName} invited you to the Weekend FC League`,
    html: layout({
      heading: "There’s a place for you.",
      intro: `${escapeHtml(
        opts.inviterName,
      )} thinks you'd be a good fit for the Weekend FC League — a weekend EA FC competition with real fixtures, standings and stats.`,
      bodyHtml: noteHtml,
      cta: { label: "Register for the league", url: opts.registerUrl },
      footerNote: "Not interested? No worries — you can safely ignore this email.",
    }),
  }
}
