# Deploying GivahBz (e.g. Vercel)

## Avoid 404 / NOT_FOUND on Vercel

1. **Set environment variables** in your Vercel project (Settings → Environment Variables):
   - `NEXTAUTH_SECRET` – e.g. run `openssl rand -base64 32` and paste the value.
   - `NEXTAUTH_URL` – **must be your live site URL**, e.g. `https://your-app.vercel.app` (no trailing slash).  
     If this is wrong or missing, auth and some routes can fail or return 404.
   - Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS` (see `.env.example`).

2. **Check the build** in the Vercel dashboard (Deployments → latest → Building). If the build fails, the site can show 404 or error pages.

3. **Which URL returns 404?**
   - **Homepage (`/`)** – Usually a failed build or wrong `NEXTAUTH_URL`. Redeploy after setting env vars.
   - **A specific page** – Confirm the route exists under `app/` (e.g. `app/contact/page.tsx` → `/contact`).
   - **After login** – Ensure `NEXTAUTH_URL` is your production URL and that you’ve added the same URL (and callback path) in your Google OAuth client if using Google sign-in.

4. **Redeploy** after changing environment variables (Vercel uses them at build and runtime).

## Google OAuth on production

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), add to your OAuth client’s “Authorized redirect URIs”:

- `https://your-app.vercel.app/api/auth/callback/google`

Replace `your-app.vercel.app` with your real Vercel URL.
