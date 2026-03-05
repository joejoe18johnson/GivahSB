# Supabase email templates (GivahBZ style)

Use these full HTML templates in **Supabase Dashboard → Authentication → Email Templates**. They match the app’s layout: banner, logo, body, footer, and direct image URLs so logos/banners render in email clients.

**Direct image URLs (production):**
- Logo: `https://www.givahbz.com/givah-logo.png`
- Banner: `https://www.givahbz.com/Givah-Banner.png`

---

## 1. Confirm signup

**Where:** Email Templates → **Confirm signup**

**Subject (optional):**  
`Confirm your email – GivahBZ`

**Body (paste the HTML below):**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your email</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f6f7; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f7;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Banner -->
          <tr>
            <td align="center" style="background-color:#1FA84A; padding:0; line-height:0; min-height: 120px;">
              <img src="https://www.givahbz.com/Givah-Banner.png" alt="GivahBZ" width="600" height="120" style="display:block; width:100%; max-width:600px; height:auto; border:0; outline:none; text-decoration:none;" />
            </td>
          </tr>
          <!-- Logo -->
          <tr>
            <td style="padding: 24px 24px 8px 24px;">
              <a href="{{ .SiteURL }}" style="text-decoration: none;">
                <img src="https://www.givahbz.com/givah-logo.png" alt="GivahBZ" width="180" height="54" style="display:block; width:180px; height:auto; border:0; outline:none; text-decoration:none;" />
              </a>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 8px 24px 24px 24px;">
              <h2 style="color:#0E3E7B; margin:0 0 16px 0; font-size: 22px;">
                Confirm your email address
              </h2>
              <p style="color:#333333; font-size: 16px; line-height: 1.6; margin:0 0 16px 0;">
                Welcome to <strong style="color:#1FA84A;">GivahBZ</strong>! We're excited to have you join our community.
              </p>
              <p style="color:#333333; font-size: 16px; line-height: 1.6; margin:0 0 24px 0;">
                Please confirm your email by clicking the button below. This link works on any device.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
                       style="background-color:#0E3E7B; color:#ffffff; padding:14px 28px; text-decoration:none; font-size:16px; border-radius:30px; display:inline-block;">
                      Confirm email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#777777; font-size: 14px; margin:0;">
                If you did not create an account with GivahBZ, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              This email was sent by GivahBZ. &copy; 2026 GivahBZ.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Reset password

**Where:** Email Templates → **Reset password** (or **Recover password**)

**Subject (optional):**  
`Reset your password – GivahBZ`

**Body (paste the HTML below):**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f6f7; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f7;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Banner -->
          <tr>
            <td align="center" style="background-color:#1FA84A; padding:0; line-height:0; min-height: 120px;">
              <img src="https://www.givahbz.com/Givah-Banner.png" alt="GivahBZ" width="600" height="120" style="display:block; width:100%; max-width:600px; height:auto; border:0; outline:none; text-decoration:none;" />
            </td>
          </tr>
          <!-- Logo -->
          <tr>
            <td style="padding: 24px 24px 8px 24px;">
              <a href="{{ .SiteURL }}" style="text-decoration: none;">
                <img src="https://www.givahbz.com/givah-logo.png" alt="GivahBZ" width="180" height="54" style="display:block; width:180px; height:auto; border:0; outline:none; text-decoration:none;" />
              </a>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 8px 24px 24px 24px;">
              <h2 style="color:#0E3E7B; margin:0 0 16px 0; font-size: 22px;">
                Reset your password
              </h2>
              <p style="color:#333333; font-size: 16px; line-height: 1.6; margin:0 0 16px 0;">
                We received a request to reset the password for your GivahBZ account.
              </p>
              <p style="color:#333333; font-size: 16px; line-height: 1.6; margin:0 0 24px 0;">
                Click the button below to choose a new password. The link will expire after a short time.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                       style="background-color:#0E3E7B; color:#ffffff; padding:14px 28px; text-decoration:none; font-size:16px; border-radius:30px; display:inline-block;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#777777; font-size: 14px; margin:0;">
                If you did not request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              This email was sent by GivahBZ. &copy; 2026 GivahBZ.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link (if you use passwordless sign-in)

**Where:** Email Templates → **Magic Link**

**Subject (optional):**  
`Sign in to GivahBZ`

**Body (paste the HTML below):**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to GivahBZ</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f6f7; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f7;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Banner -->
          <tr>
            <td align="center" style="background-color:#1FA84A; padding:0; line-height:0; min-height: 120px;">
              <img src="https://www.givahbz.com/Givah-Banner.png" alt="GivahBZ" width="600" height="120" style="display:block; width:100%; max-width:600px; height:auto; border:0; outline:none; text-decoration:none;" />
            </td>
          </tr>
          <!-- Logo -->
          <tr>
            <td style="padding: 24px 24px 8px 24px;">
              <a href="{{ .SiteURL }}" style="text-decoration: none;">
                <img src="https://www.givahbz.com/givah-logo.png" alt="GivahBZ" width="180" height="54" style="display:block; width:180px; height:auto; border:0; outline:none; text-decoration:none;" />
              </a>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 8px 24px 24px 24px;">
              <h2 style="color:#0E3E7B; margin:0 0 16px 0; font-size: 22px;">
                Sign in to GivahBZ
              </h2>
              <p style="color:#333333; font-size: 16px; line-height: 1.6; margin:0 0 24px 0;">
                Click the button below to sign in. This link works on any device and expires soon.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                       style="background-color:#0E3E7B; color:#ffffff; padding:14px 28px; text-decoration:none; font-size:16px; border-radius:30px; display:inline-block;">
                      Sign in
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#777777; font-size: 14px; margin:0;">
                If you did not request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              This email was sent by GivahBZ. &copy; 2026 GivahBZ.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Change Email Address (if you use it)

**Where:** Email Templates → **Change Email Address**

**Subject (optional):**  
`Confirm your new email – GivahBZ`

**Body (paste the HTML below):**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm new email</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f6f7; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f7;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Banner -->
          <tr>
            <td align="center" style="background-color:#1FA84A; padding:0; line-height:0; min-height: 120px;">
              <img src="https://www.givahbz.com/Givah-Banner.png" alt="GivahBZ" width="600" height="120" style="display:block; width:100%; max-width:600px; height:auto; border:0; outline:none; text-decoration:none;" />
            </td>
          </tr>
          <!-- Logo -->
          <tr>
            <td style="padding: 24px 24px 8px 24px;">
              <a href="{{ .SiteURL }}" style="text-decoration: none;">
                <img src="https://www.givahbz.com/givah-logo.png" alt="GivahBZ" width="180" height="54" style="display:block; width:180px; height:auto; border:0; outline:none; text-decoration:none;" />
              </a>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 8px 24px 24px 24px;">
              <h2 style="color:#0E3E7B; margin:0 0 16px 0; font-size: 22px;">
                Confirm your new email address
              </h2>
              <p style="color:#333333; font-size: 16px; line-height: 1.6; margin:0 0 24px 0;">
                You requested to change your email to <strong>{{ .NewEmail }}</strong>. Click the button below to confirm.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                       style="background-color:#0E3E7B; color:#ffffff; padding:14px 28px; text-decoration:none; font-size:16px; border-radius:30px; display:inline-block;">
                      Confirm new email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#777777; font-size: 14px; margin:0;">
                If you did not request this change, please secure your account.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              This email was sent by GivahBZ. &copy; 2026 GivahBZ.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## How to use

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Email Templates**.
3. Select the template (Confirm signup, Reset password, Magic Link, or Change Email Address).
4. Optionally set the **Subject** line as shown above.
5. Replace the **Body** with the full HTML from the section above (copy from `<!DOCTYPE html>` through `</html>`).
6. Click **Save**.

All templates use:

- **Banner:** `https://www.givahbz.com/Givah-Banner.png` (with green `#1FA84A` fallback)
- **Logo:** `https://www.givahbz.com/givah-logo.png`
- Same layout and colors as your app/Resend emails (GivahBZ green `#1FA84A`, blue `#0E3E7B`, white card on gray background, rounded button, footer)

Confirm signup uses the **token_hash** link so verification works from any device; the others use `{{ .ConfirmationURL }}` where Supabase expects it.
