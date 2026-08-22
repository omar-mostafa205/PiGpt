# Deploying PiGPT (free path)

This is the no-store, no-subscription route: the API on Render's free tier, and the app installed directly from an APK.
Total cost is Gemini usage only.

There is one thing you cannot avoid paying for: **Gemini billing**.
The free API tier allows 20 requests per day, which is not enough to use the app at all.
Everything else below is free.

---

## 1. Enable Gemini billing

Open the Google Cloud project behind your `GEMINI_API_KEY` and enable billing on it.
Without this the app returns a rate-limit message after roughly twenty questions per day.

Flash models are inexpensive per token, but check the current rates on Google's pricing page rather than assuming.

---

## 2. Deploy the API to Render

The repo already contains [`render.yaml`](render.yaml), so Render can configure the service itself.

1. Push to GitHub (already done).
2. In Render, choose **New > Blueprint** and select this repository.
3. Render reads `render.yaml` and creates a free web service named `pigpt-api`.
4. Fill in the four secrets it marks as required:
   - `DIRECT_URL` — your Neon connection string, including `?sslmode=require`
   - `GEMINI_API_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_PUBLISHABLE_KEY`
5. Deploy, then confirm `https://<your-service>.onrender.com/health` returns `{"status":"ok"}`.

The build runs `npm ci && npm run build`, and start runs `prisma migrate deploy` before booting, so schema changes apply automatically on each deploy.

### The one catch with the free tier

Free Render services sleep after about 15 minutes of inactivity, and the next request waits roughly a minute while the service wakes.
For a chat app that first request feels broken even though it is not.

If that becomes annoying, the paid instance (about $5/month) removes it.
Nothing in the code needs to change.

---

## 3. Point the app at the deployed API

In [`mobile/eas.json`](mobile/eas.json), replace the placeholder in the `preview` profile:

```json
"EXPO_PUBLIC_API_URL": "https://your-service.onrender.com"
```

Do **not** put the Clerk key in this file.
Set it as an EAS secret instead, so the key is never committed:

```bash
npx eas-cli secret:create --scope project \
  --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value pk_test_xxx
```

---

## 4. Build an Android APK

An Expo account is required, and it is free.

```bash
cd mobile
npx eas-cli login
npx eas-cli build --profile preview --platform android
```

The `preview` profile is already set to produce an APK rather than an AAB, which is what allows direct installation without a store.

When the build finishes, EAS gives you a download link.
Open it on an Android phone and install.
Android will warn about installing outside the Play Store; allow it for the browser doing the install.

That link can be shared with anyone you want to test the app.

---

## What this path does not give you

- **No iOS.** Apple requires the $99/year developer account to install on any device other than one attached to Xcode.
- **No public listing.** The app is not discoverable or searchable; distribution is by link.
- **No automatic updates.** Each new version means a new APK. `eas update` can push JavaScript-only changes over the air without a rebuild, and is free.

## When you are ready for the Play Store

Registration is $25 once, not a subscription.
Two things change:

- Build with `--profile production`, which produces an AAB and auto-increments the version code.
- New personal developer accounts must run a closed test with 12 testers for 14 continuous days before a public release is allowed. Budget that time.

---

## Before a real release

These are fine for testing but not for real users:

- **Clerk is on test keys** (`pk_test_` / `sk_test_`), which have strict limits. Swap to a production instance.
- **Rate limiting is in-process** ([`rateLimit.ts`](backend/src/middleware/rateLimit.ts)). It resets on deploy and is not shared across instances. Move it to Redis before scaling past one.
- **`CORS_ORIGINS` is empty.** That is correct while only the mobile app calls the API, since native requests carry no `Origin` header. Set it if a web client is ever added.
