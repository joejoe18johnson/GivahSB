# Vercel: Deploy the Latest Commit (Fix Build Failure)

## What’s going wrong

The build fails with:

- `Export sendCampaignSubmittedForReviewEmail doesn't exist in target module`
- Same for `sendDonationReceivedEmail` and `sendDonationApprovedEmail`

Your **latest code on GitHub is already fixed** (commit `52a3dad` on `main`).  
Vercel is still building an **old commit** (`1af2898`). That old commit doesn’t have the fix, so the build keeps failing.

So the problem is **which commit** Vercel is building, not the code itself.

## What to do in Vercel

You must start a deployment that uses the **latest** commit on `main`, not “Redeploy” on an old one.

### Option A: Deploy from latest (recommended)

1. Open your Vercel project.
2. Go to the **Deployments** tab.
3. Find the deployment that was built from the **latest** commit on `main` (message like `fix: add missing email exports...` or the most recent one).
4. Open the **⋮** menu on that deployment and choose **Promote to Production** (if it isn’t already production).

If there is no deployment from the latest commit yet:

- Go to the **Deployments** tab.
- Click **“Redeploy”** only on the deployment that shows the **latest** commit (e.g. `52a3dad`), **not** on an older one that shows `1af2898`.

### Option B: Trigger a new deployment from Git

1. In the project, go to **Settings → Git**.
2. Confirm **Production Branch** is `main`.
3. Push a new commit to `main` (e.g. an empty commit):
   ```bash
   git commit --allow-empty -m "chore: trigger Vercel deploy from latest main"
   git push origin main
   ```
4. Vercel should start a new deployment from the latest commit. Wait for it to finish.

### What not to do

- Do **not** click **“Redeploy”** on a deployment that was built from commit **1af2898**.  
  Redeploy always rebuilds the **same** commit, so you’ll keep building the old, broken code.

## Check the commit being built

In the build log, the first lines show something like:

```text
Cloning github.com/joejoe18johnson/GivahSB (Branch: main, Commit: xxxxxxx)
```

- If you see **Commit: 1af2898** → you’re still building the old commit. Use Option A or B above.
- If you see **Commit: 52a3dad** (or a newer hash) → you’re building the fixed code; the build should pass.
