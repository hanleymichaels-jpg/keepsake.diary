# Keepsake — a diary you talk to

A home-screen web app for one person: open, talk, maybe snap a
photo, done. See [SPEC.md](SPEC.md) for the why and the decisions.

## Status

**Stage 2 · Memory.** Everything from stage 1 (voice, typing, photos,
clips, undo) plus a cloud backup: sign in once with an email code, entries
and media sync to Supabase while the app is open, recordings are
transcribed server-side with her names list as a vocabulary hint, and
people, places and keywords are pulled out by Claude. Local-first: the
phone is always the copy she sees; the server fills in transcripts and
chips. Without a `.env` the app still runs phone-only.

Setup is in [SETUP.md](SETUP.md). Verified in a desktop browser; the iOS
risks in the spec are still to be proven on her phone.

## Commands

```bash
pnpm dev       # local dev server (also reachable from a phone on the same wifi)
pnpm build     # production build into dist/
pnpm dev:api   # the two serverless functions on :8788 (needs .env)
pnpm icons     # render public/icons/*.png from a candidate: pnpm icons fern
```

## Layout

- `src/screens/` — Home (stream + Remember button), Editor (showback, Write,
  Edit), Memory, Settings, Icons.
- `src/state.tsx` — the store: in-memory list mirrored to IndexedDB through
  `src/db.ts`. Soft delete with an Undo window.
- `src/recorder.ts` — MediaRecorder wrapper that always yields what was
  captured, even when interrupted.
- `src/media.ts` — photo resizing, video length check, poster frames,
  thumbnails.
- `src/derive.ts` — local stand-in for the names extraction, used until the
  server's answer arrives.
- `src/sync.ts` — local-first sync: push dirty entries and media, pull server
  changes, ask the functions to transcribe or re-extract.
- `src/supabase.ts` — client and session hook. Unconfigured = phone-only.
- `netlify/functions/` — `transcribe` and `extract`, plain Request/Response
  functions. `pnpm dev:api` serves them locally with Node.
- `supabase/schema.sql` — tables, bucket and row-level security.
- `public/icons/candidates/` — the three icon SVGs. `scripts/make-icons.mjs`
  renders the chosen one to every size.
