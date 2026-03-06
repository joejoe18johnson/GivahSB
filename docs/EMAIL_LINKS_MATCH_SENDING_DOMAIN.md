# Link URLs must match sending domain

Spam filters flag emails whose links point to a different domain than the one you send from. For example, sending from `noreply@givahbz.com` but linking to `https://givah-sb.vercel.app/` causes a mismatch.

**Rule:** All links in emails (confirm, reset password, etc.) should use your **production domain** (e.g. `https://www.givahbz.com`), not the Vercel deployment URL (`https://givah-sb.vercel.app`).

---

## 1. Supabase (auth emails: confirm signup, reset password)

Supabase uses the **Site URL** from your project for `{{ .SiteURL }}` in email templates. If that is set to the Vercel URL, confirmation/reset links will point there and trigger the mismatch.

**Fix:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **URL Configuration**.
3. Set **Site URL** to your production domain (must match or align with your sending domain):
   - **Use:** `https://www.givahbz.com`
   - **Do not use:** `https://givah-sb.vercel.app` or other Vercel URLs for Site URL.
4. In **Redirect URLs**, keep your production URL and add any others you need for auth (e.g. `https://www.givahbz.com/auth/confirm`, `https://www.givahbz.com/auth/callback`). You can still add `https://givah-sb.vercel.app/auth/confirm` etc. for testing, but **Site URL** should stay as production.
5. Save.

After this, new auth emails will use `https://www.givahbz.com` in links (e.g. confirm, reset password), so links match the sending domain.

---

## 2. Vercel environment variables (app and Resend emails)

If your app or Resend sends emails and builds links using `NEXT_PUBLIC_SITE_URL`, that value must be the production domain in the environment that actually sends the email.

**Fix:**

1. Vercel Dashboard → your project → **Settings** → **Environment Variables**.
2. For **Production** (and any environment that sends user-facing emails):
   - Set `NEXT_PUBLIC_SITE_URL` = `https://www.givahbz.com` (no trailing slash).
3. Do **not** set `NEXT_PUBLIC_SITE_URL` to the Vercel deployment URL (e.g. `https://givah-sb.vercel.app`) for production.
4. Redeploy after changing so the new value is used.

Preview deployments can keep using the preview URL for the app itself, but if they send real emails, consider using the same production URL for `NEXT_PUBLIC_SITE_URL` so links in those emails still match the sending domain.

---

## 3. Resend / SMTP sending domain

Send auth and transactional emails from a address on the same domain as your site (e.g. `noreply@givahbz.com` or `noreply@www.givahbz.com`). Then:

- **Site URL / link domain:** `https://www.givahbz.com`
- **Sending domain:** `givahbz.com` (or `www.givahbz.com`)

So “link URLs match sending domain” is satisfied.

---

## Summary

| Where              | What to set | Use this value              |
|--------------------|------------|-----------------------------|
| Supabase → Site URL| Site URL   | `https://www.givahbz.com`   |
| Vercel (production)| `NEXT_PUBLIC_SITE_URL` | `https://www.givahbz.com` |
| Email sender       | From address | e.g. `noreply@givahbz.com` |

After updating Supabase Site URL and Vercel production env, redeploy and send a new test email; links should use `https://www.givahbz.com` and match the sending domain.
