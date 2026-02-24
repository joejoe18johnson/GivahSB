# Get GivahBz showing on Vercel (https://givahbz.vercel.app)

You're deploying **from GitHub**: when you push to your connected repo, Vercel automatically builds and deploys. Your local `.env` is not in GitHub (it's gitignored), so you must add the same Supabase (and admin) variables in Vercel.

Follow these steps **in order**. After each deploy, wait for the build to finish.

---

## 1. Push your latest code to GitHub

From your project folder:

```bash
git add .
git commit -m "Deploy with Supabase"
git push origin main
```

(Use your real branch name if it's not `main`.)

Vercel will detect the push and start a new deployment. In the Vercel dashboard, wait until it finishes (green check).

---

## 2. Add Supabase env vars in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → your **GivahBz** project.
2. **Settings** → **Environment Variables**.
3. Add these variables (copy values from your local `.env`):

   | Name | Value (from your .env) |
   |------|------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon (public) key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep secret) |
   | `ADMIN_EMAILS` | Comma-separated admin emails |
   | `NEXT_PUBLIC_ADMIN_EMAILS` | Same as ADMIN_EMAILS (for client-side admin check) |

4. For each variable, enable **Production** (and Preview if you want).
5. Save.

---

## 3. Redeploy so env vars are used

Env vars only apply on the **next** build.

1. In your project, open the **Deployments** tab.
2. Click the **⋯** on the **latest** deployment.
3. Click **Redeploy** → confirm.

Wait for the new deployment to finish.

---

## 4. Check that it's working

Open these URLs (use your real domain if different):

1. **Campaigns API**  
   https://givahbz.vercel.app/api/campaigns  
   - You should see a JSON array of campaigns (from Supabase).  
   - If you see an error, check Supabase env vars and that the migration has been run.

2. **Homepage**  
   https://givahbz.vercel.app  
   - Trending campaigns should load.

3. **Campaigns page**  
   https://givahbz.vercel.app/campaigns  
   - Should show the same campaigns as the API.

---

## If it's still not showing

- **Hard refresh:** Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac) to avoid browser cache.
- **Confirm deployment:** Deployments tab → latest deployment should be "Ready" and include your latest commit.
- **Confirm env:** Settings → Environment Variables → all Supabase and admin vars exist and match your working `.env`.
- **Redeploy again** after any env change.

Your Vercel domain will show live Supabase data once the env vars are set and a deployment has completed after adding them.
