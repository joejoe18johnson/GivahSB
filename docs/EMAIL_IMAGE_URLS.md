# Direct image URLs for all emails

Email clients often block or break images that use redirects or app routes. Use **direct URLs** to your logo and banner so they render reliably.

## Production URLs (use these in templates)

| Asset | Direct URL |
|-------|------------|
| **Logo** | `https://www.givahbz.com/givah-logo.png` |
| **Banner** | `https://www.givahbz.com/Givah-Banner.png` |

Use these exact URLs in:

- **Supabase** → Authentication → Email Templates (Confirm signup, Reset password, etc.)
- Any other HTML email template (no `_next/image` or app routes).

## Example: Supabase Confirm signup template

Logo in the header:

```html
<img src="https://www.givahbz.com/givah-logo.png" alt="GivahBZ Logo" width="180" height="54" style="display:block; width:180px; height:auto; border:0;">
```

Banner (if you use one):

```html
<img src="https://www.givahbz.com/Givah-Banner.png" alt="GivahBZ" width="600" height="120" style="display:block; width:100%; max-width:600px; height:auto; border:0;">
```

## App emails (Resend)

The app’s transactional emails in `lib/email.ts` already use these direct URLs via `getEmailAssetBase()`. No code change needed for Resend emails.

## Do not use

- `https://yoursite.com/_next/image?url=...` — does not work in most email clients.
- Relative paths like `/givah-logo.png` — must be full `https://` URLs.
