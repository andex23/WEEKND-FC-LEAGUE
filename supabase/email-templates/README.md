# Weekend FC authentication emails

These templates use the same crest, paper background, muted body copy, and pale green action as the application emails in `lib/email/templates.ts`. `subjects.json` contains their subject lines. `confirm-signup.html` is retained as the existing signup-template filename.

Configure the six authentication templates in the Supabase dashboard for the Weekend FC project. Preserve `{{ .ConfirmationURL }}` for action links and `{{ .Token }}` for reauthentication. Security notification toggles are separate; do not enable them merely to update presentation.

The production sender is `Weekend FC <noreply@weekendfc.site>` through Resend SMTP. Keep the sending key in the provider settings and Vercel environment, never in these templates. The authentication Site URL is `https://weekendfc.site`, with `https://weekendfc.site/**` in its redirect allowlist.
