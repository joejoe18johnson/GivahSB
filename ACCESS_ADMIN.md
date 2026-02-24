# How to Access the Admin Dashboard

## 1. Create a `.env` file (if you don't have one)

In the project root (`CrowdFund/`), copy the example and add a secret:

```bash
cp .env.example .env
```

Then edit `.env` and set at least:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any-random-string-at-least-32-chars-long
ADMIN_EMAILS=admin@givahbz.com
NEXT_PUBLIC_ADMIN_EMAILS=admin@givahbz.com
```

- Use your actual port if different (e.g. `http://localhost:3002`).
- Generate a secret: `openssl rand -base64 32` and paste the result as `NEXTAUTH_SECRET`.
- **NEXT_PUBLIC_ADMIN_EMAILS** is required for the admin dashboard: the app checks admin status in the browser, and only `NEXT_PUBLIC_*` variables are available there. Use the exact email you sign in with (comma-separated for multiple admins).
- **ADMIN_EMAILS** is used by server-side API routes (e.g. approve donation, create campaign). Set both to the same list.

## 2. Restart the dev server

After changing `.env`, restart:

```bash
npm run dev
```

## 3. Sign in with the admin account

1. Open **http://localhost:3000/auth/login** (or your port).
2. Sign in with **email/password** or **Google** using an email that is in `NEXT_PUBLIC_ADMIN_EMAILS`.
3. If using the seed admin: **Email** `admin@givahbz.com`, **Password** `Admin123!`
4. Click Sign in.

## 4. Open the admin dashboard

- Go to **http://localhost:3000/admin** (or your port). You should be redirected there automatically after login if you’re an admin.

You should see the dashboard with stats (Campaigns, Total Raised, Users, Donations, Under review) and tables for recent campaigns, users, and donations. Use the left sidebar to open **Campaigns**, **Donations**, **Under review**, or **Users**.

---

## If you still can't access

- **Redirected to login:** You’re not signed in. Sign in with an email that is in `NEXT_PUBLIC_ADMIN_EMAILS`.
- **Redirected to home (/)** or **“Access denied”:** The browser doesn’t see your email as admin. You must set **NEXT_PUBLIC_ADMIN_EMAILS** (not only `ADMIN_EMAILS`) with your sign-in email, then **restart the dev server** (or **redeploy** on Vercel). Next.js bakes `NEXT_PUBLIC_*` into the client at build time, so env changes require a restart/redeploy. Then sign out and sign in again.
- **On Vercel:** Add **ADMIN_EMAILS** (e.g. `ADMIN_EMAILS=your@email.com`) in Project → Settings → Environment Variables. The server uses this for `/api/check-admin`, so admin login works even without `NEXT_PUBLIC_ADMIN_EMAILS`. Redeploy after changing env vars, then sign out and sign in again.
- **Blank or loading forever:** Check the browser console and terminal for errors. Ensure `.env` is in the project root (same folder as `package.json`).
