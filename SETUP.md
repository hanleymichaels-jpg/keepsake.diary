# Setting up the backend (stage 2)

One-time, about twenty minutes. Done by you, not her. When it's finished she
signs in once on her phone with her email and a six-digit code.

## 1. Supabase project

1. Create a project at supabase.com (any region near you; the free plan is fine
   to start, upgrade later if storage passes 1GB).
2. **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, run it.
   This creates the `entries` and `settings` tables, the private `media`
   bucket, and the row-level rules that keep everything scoped to her account.
3. **Authentication → Providers → Email**: leave Email enabled. Turn **off**
   "Confirm email" if you want the first sign-in to be a single step.
4. **Authentication → Email Templates → Magic Link**: replace the body so it
   sends a code instead of a link. The code is `{{ .Token }}`. A minimal body:

   ```html
   <h2>Your Keepsake code</h2>
   <p style="font-size:32px;letter-spacing:.2em"><strong>{{ .Token }}</strong></p>
   <p>Type this into Keepsake. It works for the next hour.</p>
   ```

   The app never uses the link form: a magic link opens in Safari, which does
   not share a session with the installed app on iOS.
5. **Authentication → Users → Add user → Create new user**: her email. Tick
   "Auto confirm". The app signs in with `shouldCreateUser: false`, so only
   addresses you add here can ever sign in.
6. **Authentication → Sign In / Up**: you may also turn off "Allow new users
   to sign up" as a second lock.
7. **Project Settings → API**: copy the Project URL, the `anon` public key and
   the `service_role` secret key.

## 2. Speech to text and extraction

- An OpenAI API key for transcription (model `gpt-4o-transcribe`; set
  `TRANSCRIBE_MODEL=whisper-1` to use the older model instead).
- An Anthropic API key for pulling people, places and keywords out of each
  entry (model `claude-opus-5-5`).

Both are a few cents per hour of speech.

## 3. Environment variables

Locally: copy `.env.example` to `.env` and fill it in. `.env` is git-ignored.

On Netlify: **Site configuration → Environment variables**, add the same six
names with the same values. The `VITE_` pair reaches the browser; the others
stay in the functions. Leave the "secret" switch off: on the free plan,
variables added with it set were silently dropped and the functions failed
with "Missing environment variable".

| Name | Where it goes |
|---|---|
| `VITE_SUPABASE_URL` | browser |
| `VITE_SUPABASE_ANON_KEY` | browser |
| `SUPABASE_URL` | functions |
| `SUPABASE_SERVICE_ROLE_KEY` | functions, never the browser |
| `OPENAI_API_KEY` | functions |
| `ANTHROPIC_API_KEY` | functions |

## 4. Run it locally

Two processes:

```bash
pnpm dev:api
```

```bash
pnpm dev
```

The first serves the two functions on port 8788 with plain Node (no Netlify
CLI needed). The second is the app on 5175 and proxies `/api/*` to the first.
Without a `.env` the app runs phone-only, exactly as stage 1 did.

## 5. Netlify

The site is `keepsake-diary-1v90` on the Hanley Development Co. team
(https://app.netlify.com/projects/keepsake-diary-1v90), created on
20 October 2026 with all six variables set. Until a GitHub remote exists it
is deployed by direct upload from this folder; once the repository is on
GitHub, connect it so pushes to `main` deploy. Build command `pnpm build`,
publish directory `dist` (already in `netlify.toml`). Functions deploy from
`netlify/functions` automatically. Add the custom domain `keepsake.diary` under **Domain
management** once you own it, and install the app on her phone from that
address, not from the `netlify.app` one.

Function timeout: Netlify runs synchronous functions for 10 seconds on the
free plan and up to 26 on paid plans. A one-minute recording transcribes in a
few seconds; a ten-minute one may not finish in time. The app retries after
three minutes and nothing is lost either way, but if long recordings turn
out to be common, the transcription moves to a background function.

## 6. Her phone

1. Open `https://keepsake.diary` in Safari, Share, **Add to Home Screen**.
2. Open the installed app. Email, then the code from the email, then *That's it*.
3. Tap *Remember* once and allow the microphone.
4. Tap *Add a photo or video* once and allow the camera and photos.
5. Settings: paste the names list.

## What the sync does

- Everything saves on the phone first. Backup runs while the app is open,
  retries when the phone comes back online, and shows *Backing up…* on Home
  while there is something waiting.
- When a recording is backed up, the app asks the server to transcribe it.
  The transcript and the chips appear a few seconds later. If she typed
  something before the transcript arrived, her words win and the transcript
  is kept alongside.
- Editing the text re-derives the chips in the background.
- A new phone: sign in and the diary comes back, text first, photos and
  audio as she opens them.
