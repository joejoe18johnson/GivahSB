# Seeing changes slowly after Vercel deploy

## What we did

In **`next.config.js`** we added a `Cache-Control` header so the CDN and browser revalidate page responses instead of serving old cached content:

- **Header:** `Cache-Control: public, max-age=0, must-revalidate`
- **Effect:** After a redeploy, the next request for a page should get the new version (or revalidate with the origin). You should see updates sooner without waiting for caches to expire.

Redeploy after this change so the new headers apply.

## If updates still feel slow

1. **Hard refresh**  
   - **Windows/Linux:** `Ctrl + Shift + R` or `Ctrl + F5`  
   - **Mac:** `Cmd + Shift + R`  
   This bypasses the browser cache for the current tab.

2. **Check the deploy**  
   In the Vercel dashboard, confirm the latest deploy finished successfully and that you’re opening the deployment URL (or the production URL that points to that deploy).

3. **Try incognito/private**  
   Open the site in a private/incognito window so no old cache is used.

4. **Purge Vercel cache (optional)**  
   In Vercel: Project → Settings → General → scroll to “Build Cache” / “Data Cache” and use “Purge” if you need to force everything to refresh.

## Why it can feel slow

- **Browser cache** – The browser may keep the previous HTML/JS until it expires or you hard refresh.
- **Vercel Edge** – Edge nodes can cache responses; `max-age=0, must-revalidate` tells them to revalidate with the origin so new deploys are picked up.
- **Static assets** – JS/CSS under `_next/static` use hashed filenames, so a new deploy uses new URLs and they’re naturally “fresh”; the main delay is usually the document (HTML) or API responses, which the new header targets.
