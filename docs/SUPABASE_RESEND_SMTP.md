# Supabase Auth Emails via Resend (SMTP)

Use Resend to send **Supabase Auth** emails (sign-up verification, password reset) so they are reliable and match your domain. The app also uses Resend’s **API** for transactional emails (donation receipts, payout notifications, etc.); this guide is only for **Supabase’s built-in auth emails** (verification link, reset password link).

## 1. Resend setup

- [Verify your domain](https://resend.com/domains) (e.g. `givahbz.com` or `www.givahbz.com`).
- [Create an API key](https://resend.com/api-keys) and copy it (you’ll use it as the SMTP password).

## 2. Supabase SMTP configuration

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Project Settings** (gear) → **Auth** (or **Authentication** → **Settings**).
3. Find the **SMTP Settings** section and enable **Custom SMTP**.
4. Use these values:

| Setting    | Value |
|-----------|--------|
| **Host**  | `smtp.resend.com` |
| **Port**  | `465` (SMTPS) or `587` (STARTTLS) |
| **Username** | `resend` |
| **Password** | Your Resend API key (from step 1) |
| **Sender email** | An address on your verified domain, e.g. `noreply@givahbz.com` or `Givah BZ <noreply@givahbz.com>` |
| **Sender name** (if supported) | e.g. `Givah BZ` |

5. Save. Supabase will use this for:
   - **Confirm signup** (email verification link)
   - **Reset password** (password reset link)

## 3. Redirect URLs (required for links in emails)

In **Authentication** → **URL Configuration**:

- **Site URL**: `https://www.givahbz.com` (or your app URL).
- **Redirect URLs** must include:
  - `https://www.givahbz.com/auth/callback`
  - `https://www.givahbz.com/auth/confirm`
  - `https://www.givahbz.com/auth/reset-password`
  - `https://www.givahbz.com/api/auth/reset-callback` (used by the password reset email link so the server can exchange the token without client lock issues)

For local dev add:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/confirm`
- `http://localhost:3000/auth/reset-password`
- `http://localhost:3000/api/auth/reset-callback`

## 4. Optional: email templates

Under **Authentication** → **Email Templates** you can edit the text of:

- **Confirm signup** (verification)
- **Reset password**

The default templates use Supabase placeholders (e.g. `{{ .ConfirmationURL }}`). Keep those so the links still work; you can change the wording and branding.

## Summary

- **Resend SMTP** (this doc): used by **Supabase** for auth emails (verification + reset password).
- **Resend API** (app code): used by the app for donation receipts, payout emails, etc. (see `lib/email.ts` and `RESEND_API_KEY` / `EMAIL_FROM` in `.env`).

Both can use the same Resend account and domain; one is configured in Supabase, the other in your app env.

---

## Troubleshooting: "Error sending recovery email"

If you see **"Error sending recovery email"** when using forgot password (or similar when confirming signup), Supabase is trying to send the email but failing. Fix it by:

1. **Enabling Custom SMTP** in Supabase: **Project Settings** → **Auth** → **SMTP Settings** → turn on **Custom SMTP**.
2. **Using Resend’s SMTP** with the values in the table above (Host `smtp.resend.com`, Username `resend`, Password = your Resend API key, Port `465` or `587`).
3. **Sender email** must use a domain you’ve **verified in Resend** (e.g. `noreply@givahbz.com`). If the domain isn’t verified, Resend will reject the send.
4. **Save** the SMTP settings in Supabase and try the forgot-password flow again.

Until Custom SMTP is set up and working, Supabase cannot send recovery or confirmation emails.
