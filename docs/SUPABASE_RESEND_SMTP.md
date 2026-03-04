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

For local dev add:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/confirm`
- `http://localhost:3000/auth/reset-password`

## 4. Optional: email templates

Under **Authentication** → **Email Templates** you can edit the text of:

- **Confirm signup** (verification)
- **Reset password**

The default templates use Supabase placeholders (e.g. `{{ .ConfirmationURL }}`). Keep those so the links still work; you can change the wording and branding.

## Summary

- **Resend SMTP** (this doc): used by **Supabase** for auth emails (verification + reset password).
- **Resend API** (app code): used by the app for donation receipts, payout emails, etc. (see `lib/email.ts` and `RESEND_API_KEY` / `EMAIL_FROM` in `.env`).

Both can use the same Resend account and domain; one is configured in Supabase, the other in your app env.
