# Google Sign-In Setup (GivahBz)

To enable **Sign in with Google** and **Continue with Google** on the login and signup pages, create a Google OAuth client and add its credentials to your app.

## 1. Create a Google Cloud project (if needed)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one (e.g. "GivahBz").
3. Make sure the project is selected in the top bar.

## 2. Enable the Google+ API / People API

1. In the left menu go to **APIs & Services** → **Library**.
2. Search for **Google+ API** or **Google People API**.
3. Open it and click **Enable** (if not already enabled).

(OAuth 2.0 sign-in uses the People API to get basic profile info.)

## 3. Create OAuth credentials

1. Go to **APIs & Services** → **Credentials**.
2. Click **Create credentials** → **OAuth client ID**.
3. If prompted, set the **OAuth consent screen**:
   - User type: **External** (for anyone with a Google account).
   - App name: **GivahBz** (or your app name).
   - User support email: your email.
   - Developer contact: your email.
   - Save and continue through scopes and test users if needed.
4. Back in **Create OAuth client ID**:
   - Application type: **Web application**.
   - Name: e.g. **GivahBz Web**.
   - **Authorized JavaScript origins**:
     - Local: `http://localhost:3000`
     - Production: `https://givahbz.vercel.app` (or your live URL).
   - **Authorized redirect URIs** (must match exactly):
     - Local: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://givahbz.vercel.app/api/auth/callback/google` (use your real domain).
5. Click **Create**.
6. Copy the **Client ID** and **Client secret**; you’ll add them to your app.

## 4. Add credentials to your app

**Local (`.env`):**

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

**Production (e.g. Vercel):**

In your hosting dashboard (e.g. Vercel → Project → Settings → Environment Variables), add:

- `GOOGLE_CLIENT_ID` = your Client ID  
- `GOOGLE_CLIENT_SECRET` = your Client secret  
- `NEXTAUTH_URL` = your live URL (e.g. `https://givahbz.vercel.app`, no trailing slash)  
- `NEXTAUTH_SECRET` = same secret you use for NextAuth  

Redeploy after changing environment variables.

## 5. Test

1. Restart the dev server if running: `npm run dev`.
2. Open the app and go to **Sign In** or **Create account**.
3. Click **Sign in with Google** or **Continue with Google**.
4. Sign in with a Google account; you should be redirected back and be logged in.

If you see “Access blocked” or “redirect_uri_mismatch”, double-check that the redirect URI in Google Console exactly matches `NEXTAUTH_URL` + `/api/auth/callback/google` (e.g. `https://givahbz.vercel.app/api/auth/callback/google`).

### Troubleshooting

- **redirect_uri_mismatch** — Redirect URI in Google Console must exactly match `NEXTAUTH_URL` + `/api/auth/callback/google`. No trailing slash.
- **Access blocked / 400** — Complete OAuth consent screen; if app is in Testing, add your email as test user.
- **Configuration error** — Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` and restart the dev server.

## Admin access with Google

To give a Google account admin access, add that account’s email to `ADMIN_EMAILS` in your `.env` (or in your hosting env vars), for example:

```env
ADMIN_EMAILS=admin@givahbz.com,you@gmail.com
```

Then sign in with that Google account and go to `/admin`.
