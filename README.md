# Keepsake — a diary you talk to

A home-screen web app for one person: open, talk, maybe snap a
photo, done. See [SPEC.md](SPEC.md) for the why and the decisions.

## Status

**Stage 1 · Capture, on the phone only.** Real microphone recording (kept as
audio, played back on the memory page), typing, photos (resized on the
phone) and video clips up to three minutes (poster frame, filming date),
all saved in the phone's own database. No backend yet: voice entries show
*Waiting to be written down* until transcription arrives in stage 2, and
she can type the words herself meanwhile. Delete and photo removal give a
five-second Undo. Three icon candidates are at Settings → Icon candidates.

Tested in a desktop browser with a synthetic microphone and generated
media; the iOS-specific risks in the spec (mic permission persisting,
recording surviving a lock) are still to be proven on her phone.

## Commands

```bash
pnpm dev       # local dev server (also reachable from a phone on the same wifi)
pnpm build     # production build into dist/
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
- `src/derive.ts` — local stand-in for the names/places extraction.
- `public/icons/candidates/` — the three icon SVGs. `scripts/make-icons.mjs`
  renders the chosen one to every size.
