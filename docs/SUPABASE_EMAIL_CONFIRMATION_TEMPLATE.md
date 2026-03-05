# Confirm signup from any device (token_hash link)

By default, Supabase sends a confirmation link that uses **PKCE** (`?code=...`). That link only works when opened in the **same browser** where the user signed up. If they open the link on another device (e.g. phone email app → mobile browser), you see:

**"PKCE code verifier not found in storage"**

To allow users to confirm their email from **any device or browser**, use a **token_hash** link in the confirmation email instead of the default link.

## 1. Redirect URL

The app already uses `emailRedirectTo: .../auth/confirm`, so the confirm page URL is correct. In **Supabase Dashboard** → **Authentication** → **URL Configuration**, ensure **Redirect URLs** include:

- `https://www.givahbz.com/auth/confirm`
- (and for local dev) `http://localhost:3000/auth/confirm`

## 2. Customize the “Confirm signup” email template

1. In [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Email Templates**.
3. Open **Confirm signup**.
4. Replace the default confirmation link with a link that uses **TokenHash** so it works on any device.

**Replace** the placeholder that looks like:

```html
<a href="{{ .ConfirmationURL }}">Confirm your mail</a>
```

**With** (adjust the link text as you like):

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
```

5. **Save** the template.

After this, the confirmation email will contain a link like:

`https://www.givahbz.com/auth/confirm?token_hash=...&type=email`

Opening that link on any device will confirm the user’s email; no code_verifier is needed.

## 3. Optional: keep using the code-based link (same device only)

If you do **not** change the template, the link will still use `?code=...` and work only when opened in the same browser where the user signed up. The app supports both:

- `?token_hash=...&type=email` → works from any device.
- `?code=...` → works only in the same browser (PKCE).

## Summary

| Link type   | Template link | Works from |
|------------|----------------|------------|
| token_hash | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` | Any device |
| code (PKCE) | Default `{{ .ConfirmationURL }}` (or similar) | Same browser only |

Use the **token_hash** link in the Confirm signup template to avoid “PKCE code verifier not found” when users open the link on a different device.
