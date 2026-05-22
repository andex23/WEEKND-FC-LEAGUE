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
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="color-scheme" content="dark"/>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#111111;border:1px solid #1E1E1E;border-radius:16px;overflow:hidden;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td style="padding:28px 32px 0 32px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="width:40px;height:40px;background-color:#10b981;border-radius:10px;text-align:center;vertical-align:middle;font-size:20px;font-weight:800;color:#0A0A0A;">W</td>
<td style="padding-left:12px;font-size:13px;font-weight:700;letter-spacing:2px;color:#8A8A8A;text-transform:uppercase;">Weekend FC League</td>
</tr></table>
</td></tr>
<tr><td style="padding:24px 32px 8px 32px;">
<h1 style="margin:0 0 12px 0;font-size:23px;line-height:1.3;color:#FFFFFF;font-weight:800;">${heading}</h1>
<p style="margin:0;font-size:15px;line-height:1.6;color:#B0B0B0;">${intro}</p>
</td></tr>
${bodyHtml ? `<tr><td style="padding:16px 32px 0 32px;">${bodyHtml}</td></tr>` : ""}
${
  cta
    ? `<tr><td style="padding:24px 32px 8px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td align="center" style="border-radius:10px;background:linear-gradient(90deg,#f5c54a,#10b981);">
<a href="${cta.url}" target="_blank" style="display:block;padding:14px 24px;font-size:15px;font-weight:800;color:#0A0A0A;text-decoration:none;">${escapeHtml(cta.label)}</a>
</td></tr></table>
</td></tr>`
    : ""
}
<tr><td style="padding:24px 32px;">
<div style="height:1px;background-color:#1E1E1E;"></div>
<p style="margin:20px 0 0 0;font-size:12px;line-height:1.6;color:#6C6C6C;">${
    footerNote ? escapeHtml(footerNote) : "Weekend FC League"
  }</p>
</td></tr>
</table>
<p style="margin:20px 0 0 0;font-size:11px;color:#5C5C5C;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Weekend FC League &middot; The weekend is for football</p>
</td></tr>
</table>
</body>
</html>`
}

export type EmailContent = { subject: string; html: string }

export function confirmEmail(name: string, confirmUrl: string): EmailContent {
  return {
    subject: "Confirm your Weekend FC League account",
    html: layout({
      heading: "Confirm your email",
      intro: `Hi ${escapeHtml(
        name,
      )}, welcome to the Weekend FC League. Confirm your email address to lock in your registration — an admin will review it right after.`,
      cta: { label: "Confirm my email", url: confirmUrl },
      footerNote:
        "Didn't sign up for the Weekend FC League? You can safely ignore this email.",
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

export function announcementEmail(title: string, message: string): EmailContent {
  const paragraphs = message
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map(
      (p) =>
        `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#B0B0B0;">${escapeHtml(
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

export function fixturesEmail(name: string, fixtures: FixtureLine[], dashboardUrl: string): EmailContent {
  const rows = fixtures.length
    ? fixtures
        .map(
          (f) => `<tr><td style="padding:10px 0;border-bottom:1px solid #1E1E1E;">
<span style="font-size:14px;color:#E0E0E0;"><span style="color:#10b981;font-weight:700;">MD${f.matchday}</span> &middot; ${escapeHtml(
            f.dateLabel,
          )}</span><br/>
<span style="color:#9E9E9E;font-size:13px;">${f.isHome ? "Home" : "Away"} vs ${escapeHtml(
            f.opponent,
          )} &middot; ${escapeHtml(f.yourClub)} v ${escapeHtml(f.oppClub)}</span>
</td></tr>`,
        )
        .join("")
    : `<tr><td style="padding:10px 0;font-size:14px;color:#9E9E9E;">No fixtures scheduled for you yet.</td></tr>`
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
    `<tr><td style="padding:6px 0;font-size:14px;color:#9E9E9E;">${label}</td><td style="padding:6px 0;font-size:14px;color:#E0E0E0;text-align:right;font-weight:700;">${escapeHtml(
      value,
    )}</td></tr>`
  return {
    subject: `Upcoming match — vs ${opts.opponent}`,
    html: layout({
      heading: "You've got a match coming up",
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
    ? `<p style="margin:0;font-size:15px;line-height:1.6;color:#B0B0B0;font-style:italic;">&ldquo;${escapeHtml(
        opts.note.trim(),
      )}&rdquo;</p>`
    : ""
  return {
    subject: `${opts.inviterName} invited you to the Weekend FC League`,
    html: layout({
      heading: "You've been invited to play",
      intro: `${escapeHtml(
        opts.inviterName,
      )} thinks you'd be a good fit for the Weekend FC League — a weekend EA FC competition with real fixtures, standings and stats.`,
      bodyHtml: noteHtml,
      cta: { label: "Register for the league", url: opts.registerUrl },
      footerNote: "Not interested? No worries — you can safely ignore this email.",
    }),
  }
}
