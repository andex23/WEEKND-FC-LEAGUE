# Registration verification and approval

## Required order

1. Apply reviewed migrations 0011 and 0012 before deploying this code. These files are prepared locally only; this change does not apply them. Set the private `REGISTRATION_ADMIN_EMAIL` environment variable to the explicitly approved organizer inbox before deployment. Do not put that address in the public repository.
2. A successful registration creates a new, unconfirmed Auth user and a pending player. `createUser` reserves a unique email; an existing account is never reused, overwritten, confirmed, or assigned a replacement password by registration.
3. The application generates a signup verification token and sends the link through its existing SMTP provider. Supabase-hosted SMTP configuration is not required.
4. The link opens `/auth/verify-email`. GET only renders the screen. A deliberate button press POSTs the token, verifies the email, and signs out the transient Auth session. No Auth access or refresh token is returned to the browser.
5. A verified pending player produces one durable admin notification addressed only to the operator-approved `REGISTRATION_ADMIN_EMAIL` value, containing display name, platform, and the admin review link. No email address, location, speed test, or other registration fields are included in that notice.
6. Admin approval requires matching, verified Auth email. The database performs the same check and commits the approved status and approval-email queue entry together. The player receives an approval email linking to sign-in; normal access checks require verified email, approved status, and completion of any queued approval email.

Existing approved accounts are not rewritten or added to the queue. Repeating approval will not create another email for them. Pending/rejected password recovery never changes approval status.

## Failure and retry behavior

- SMTP not configured at registration: return 503 before creating the account.
- Verification email failure after account creation: return 201 with `verificationEmailSent:false` and an explicit resend instruction. Keep the pending account; never ask the player to create it again.
- `/auth/check-email` resends only for existing pending, unverified accounts. It does not replace the password, profile, or status. For a verified pending account, it can retry a delayed admin notice, using a fresh server-side ownership check.
- Invalid, expired, and used verification links show a failure, not a success page. Resend is available. A successful verification with delayed admin notification is reported as verified with a retry instruction.
- Approval is not undone when SMTP fails. The API says the player is already approved, and the failed queue row can be retried using the admin Retry email control. This avoids falsely claiming rollback after an email or status change already occurred.
- Durable deliveries use `(player_id, kind)` as the unique key, and an atomic state-conditioned claim prevents concurrent duplicate sends. A sent row is never automatically retried.
- `sending` rows are never automatically reclaimed. A process may have stopped after SMTP accepted the message but before recording the result. The operator must reconcile these with the provider before changing the state. SMTP cannot provide exactly-once delivery: a reported network failure can also be ambiguous, so a retry of a `failed` row may duplicate a previously accepted message. Check provider records before manually retrying uncertain delivery.
- The queue contains only player ID, kind, state, random claim ID, and timestamps. It stores no password, token, email address, body, or raw exception.

## Admin interface

Admin lists fetch a bounded number of Auth records concurrently and expose only an email-verified boolean and approval-delivery state. Approval controls are disabled when verification is false or unavailable. Retry email appears only on verified approved accounts with an unclaimed pending or failed delivery. Bulk approval skips accounts awaiting email verification.

An admin-created account remains pending and must verify its email; it can use `/auth/check-email`, then password recovery to choose a password. Approval never confirms an email on the player's behalf.

## Verification performed

Tests use synthetic identities and fake SMTP/Auth/database boundaries. They make no real sends and no production database changes. The focused tests cover registration duplicate safety, preserved password/metadata, pending state, verification failure, explicit POST/sign-out, rate-limit boundaries, fixed admin recipient/minimized escaped content, concurrent notification claims, retry state, approval verification guard, legacy approved accounts, and admin control eligibility.

Local TypeScript checks and full native Node tests are part of the parent validation. Production SMTP delivery, actual hosted Auth tokens, and applied database migrations still need an approved staging/production smoke check.

## References

- [Supabase generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink)
- [Supabase verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp)
- [Supabase email-prefetch guidance](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching)
- [GoTrue existing-account signup link implementation](https://github.com/supabase/auth/blob/master/internal/api/mail.go)
