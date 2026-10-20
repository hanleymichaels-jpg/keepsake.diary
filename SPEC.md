# Keepsake — a diary you talk to

Status: **approved by her**, 20 October 2026. Name: Keepsake. Icon: Ember. Address: keepsakediary.net. Stages 1 and 2 built and live.

---

## 1. Purpose

One person uses this app: your wife. Her memory is gradually fading and
Alzheimer's runs in her family. She wants to keep the small moments of her
days, but a paper diary is a burden she won't carry and by evening the
details are gone.

The job of the app, in one sentence:

> In the few seconds she feels a moment is worth keeping, let her keep it
> with zero thought. Later, let the moment come back to her without her
> having to remember when it happened.

It is not a journaling product. It is a memory net.

## 2. Principles

Every design and engineering decision gets checked against these.

1. **Capture costs nothing.** Open, talk, maybe snap, done. No titles, no
   tags, no categories, no save button, no confirmation dialogs. Undo, never
   confirm.
2. **Everything is saved the moment it exists.** A recording that gets
   interrupted is still saved. A half-typed note is still saved. Leaving the
   app never loses anything.
3. **All structure is derived afterward.** Dates, people, places, keywords
   and titles come from what she said and the photos she attached. She never
   files anything.
4. **Her own voice is the memory.** The transcript is the searchable layer.
   The audio is kept, forever, and can be replayed with the memory.
5. **Design for the person she will be.** If the interface works when she is
   tired and foggy, it works every day. Big targets, one obvious action per
   screen, plain words, no gestures to learn, no hidden menus.
6. **Data loss is the worst possible failure.** Every memory lives on the
   phone and in the cloud, and the whole archive can be exported in a form a
   human can read without the app.

## 3. Decisions already made

From the design session on 20 October 2026.

| Topic | Decision |
|---|---|
| Voice | Record audio on the phone, transcribe server-side. Audio is kept. Cost is not a concern. |
| Taps to capture | Target is two: tap the icon, tap the button. Talk. Tap again. |
| Record on open | **No.** She never closes her apps, so the app must never auto-record. One big button starts it. |
| After recording | Show the entry back for review and optional edit. Saving does not depend on this screen. |
| Diary talking back | No conversational diary. The only "talk back" is replaying her own audio. |
| Typing | A full equal path, not a fallback. Sometimes she just wants to type. |
| Photos | Words first, photos are an addition. One entry can hold several photos, from the camera or the library. |
| Video | Yes, short clips, alongside photos. Filmed now or picked from the library. There are many old clips of the boys when they were small, and they belong in here. (Added 20 October 2026.) |
| Suggesting camera-roll photos | No. Too complex, fractures the simple flow. |
| Remembering | A scrolling stream of past moments, newest first. |
| Search | Keywords, plus people and places extracted automatically, as long as it stays simple. |
| Opening a memory | Show the text with a Play button. Audio does not autoplay. |
| Timing | Capture in near real time. End-of-day journaling is not a feature; the moment is. |
| Evening nudge | Yes. A gentle notification. |
| Who can see it | Just her. Caregiver persona may come later. |
| Backup | Cloud backup plus an exportable archive that can be loaded onto a new phone. |
| Device | iPhone 17 Pro Max, latest iOS. Face ID works reliably for her. |
| Lock | None in the app. The phone lock is the lock. |
| Names | You will provide a list of her people to improve transcription. |

## 4. Identity: name, icon, address

**Name.** Keepsake. Chosen 20 October 2026.

**Icon.** It must read as a diary at a glance and look good enough that she
is pleased to have it on her home screen. Direction:

- A closed diary, slightly three-quarter view so the page edges and spine
  show, with a ribbon bookmark trailing out of the bottom. The ribbon is the
  one playful element and carries the accent colour.
- Bold, flat, modern. No gradients that go muddy at small sizes, no thin
  lines. Legible at 60px on the home screen and still handsome at 1024px.
- Cover in a deep warm tone (plum, forest or ink), ribbon and a small
  embossed mark in the accent colour. The small mark is a single sound wave
  or a spark, hinting that this diary listens. If it clutters at 60px it
  goes.
- Drawn as SVG, rendered to every size iOS and the manifest need. The iOS
  home-screen icon has no transparency and no rounded corners (iOS applies
  its own), and the manifest also gets a maskable variant with safe padding.
- Three candidates were drawn (Ember, Linen, Fern). **Ember** was chosen on
  20 October 2026: plum cover, coral ribbon, a sound-wave mark on the front.

**Address.** `keepsakediary.net`, bought 20 October 2026 (`keepsake.diary` was the first choice; the `.net` name was taken instead). Netlify hosts it with the custom domain
and its own certificate, so the address she sees is just the name. Nothing
ships to her phone on a `netlify.app` address: the installed app is pinned
to whatever address it was installed from, and moving it later means
reinstalling and re-granting permissions.

## 5. Who she is, as the app sees her

- She has the phone in her hand or pocket most of the day. Face ID unlocks it.
- She will not read instructions. The first screen has to explain itself.
- She may open the app mid-sentence of a conversation, record ten seconds,
  and put the phone down without looking at it again.
- She does not close apps. The app may be reopened days later exactly where
  it was left.
- On a good day she will want to re-read and tidy an entry. On a bad day she
  will not, and the entry must be just as good.
- When she goes looking for a memory she will remember a fragment: a name, a
  place, a word, roughly how long ago. Never the date.

## 6. The flows

Tap counts are from the home screen of the phone. "Native" means an iOS
sheet the app does not control.

### 6.1 Capture by voice (the main path)

| Step | What she does | What she sees |
|---|---|---|
| 1 | Taps the app icon | **Home.** A large round button labelled *Remember* fills the lower third. Above it, today's moments, then the stream of earlier days. A small *Write* button and a search field sit at the top. |
| 2 | Taps *Remember* | The button becomes *Done* and pulses. A timer counts up. Below it, a single line: *I'm listening.* |
| 3 | Talks | Nothing changes. No live transcript (it distracts and it lags). |
| 4 | Taps *Done* | **Showback.** The entry is already saved. The text area says *Writing it down…* for a few seconds, then the transcript appears. Under it: *Add a photo or video*. At the bottom: *That's it* (returns home) and a quiet *Edit*. |
| 5 | Leaves, or taps *That's it* | Home, with the new moment at the top of today. |

Two taps to start keeping the memory. Three to finish. Anything after that is
optional.

Rules behind the flow:

- Saving happens at step 4, on the device, before any network call. The
  transcript and the cloud copy arrive later and attach to the saved entry.
- If she locks the phone, takes a call, or switches apps while recording,
  the recording stops and **what was recorded is saved** as an entry. Next
  time she opens the app it shows the showback for that entry.
- A recording stops itself after 10 minutes, with a saved entry, so a
  forgotten recording cannot run forever.
- If the transcript never arrives (no signal, server down), the entry still
  exists with its audio and a *Writing it down…* note. It is transcribed the
  next time the app is open and online. It is searchable as soon as the text
  arrives.
- Showback is the saved entry in edit mode, not a draft. Leaving the screen
  by any route keeps everything.

### 6.2 Capture by typing

| Step | What she does | What she sees |
|---|---|---|
| 1 | Taps the app icon | Home. |
| 2 | Taps *Write* | **Showback**, empty, with the keyboard already up and the cursor in the text. |
| 3 | Types | Text saves continuously. There is no save button. |
| 4 | Leaves, or taps *That's it* | Home, with the new moment at the top of today. |

An empty typed entry (she opened Write and changed her mind) is discarded
silently.

### 6.3 Adding photos and video clips

From the showback or from any opened memory:

| Step | What she does | What she sees |
|---|---|---|
| 1 | Taps *Add a photo or video* | Native iOS sheet: *Take Photo or Video* or *Photo Library*. |
| 2 | Takes one, or picks one or several | Thumbnails appear under the text. A clip's thumbnail carries a small play mark and its length. Done. |

Photos are resized on the phone before saving (long edge 2048px, JPEG) so
storage and upload stay small. The originals stay in her camera roll
untouched.

Video clips are kept as iOS hands them over, up to **three minutes** each.
A longer clip is declined with one plain sentence (*That one is longer than
three minutes. Could you trim it in Photos first?*) rather than silently
cut. A poster frame is taken on the phone for the thumbnail.

**Old clips.** A video picked from the library keeps its original filming
date, and the memory screen shows it under the clip (*filmed August 2011*).
The memory itself is still dated today, because the moment being kept is
*today she watched the boys on the beach and said something about it*. The
clip is a prompt; what she says over it is the memory, and that is what
search finds. Importing the whole old archive as back-dated memories is a
different feature and is deliberately not planned.

A photo or clip can be removed from an entry with a small *×* on the
thumbnail and a five-second *Undo*.

### 6.4 Remembering (the stream)

Home is the stream. Scrolling down is scrolling back in time.

- Moments are grouped under day headers: *Today*, *Yesterday*, then *Tuesday
  14 October*, with the year added once it isn't this year.
- Each moment card shows: time of day, the first three lines of text, photo
  thumbnails if any, and a small *Play* mark if there is audio.
- Tapping a card opens the **Memory** screen: date and time written out in
  full, the whole text, photos at full width (tap for full screen), video
  clips inline with the standard iOS player and sound on when she taps
  play, a *Play* button with the audio length for her recording, and small
  chips for the people and places the app picked out (*with Margaret · at
  the lake*). Tapping a chip searches for it.
- *Edit* on the memory screen opens the same editor as showback. *Delete*
  lives inside Edit, at the bottom, and gives a five-second *Undo* rather
  than a confirm dialog.

### 6.5 Searching

- The search field at the top of Home filters the stream as she types.
  Results keep the same day grouping, so "when" is still visible.
- A search matches: the text, the extracted people, places and keywords,
  and the written-out date (*October*, *Tuesday*, *2026*).
- Search runs on the phone against the local copy, so it is instant and
  works offline.
- Clearing the field returns to the full stream. No search history, no
  filters, no advanced mode.

### 6.6 Replaying a memory

On the memory screen, *Play* plays her recording with the photos still on
screen. A pause button and a simple progress line. That is the whole player.

### 6.7 The evening nudge

- One notification a day, at a time you set (default 7:30pm), **only on days
  with no entry yet**. Days that already have a moment get no nudge.
- Wording is warm and short: *Anything from today?* We will ask her what she
  wants it to say.
- Tapping it opens Home. Nothing else.
- It can be switched off in Settings.

### 6.8 Backup, new phone, export

- **Live backup.** Every entry, recording and photo is uploaded to the cloud
  in the background while the app is open. Settings shows a single line:
  *Everything is backed up* or *3 moments waiting to back up*.
- **New phone.** Install the app, sign in with her email and a six-digit
  code (no passwords), and the whole diary comes back: text first, then
  photos and audio as they are needed. One-time setup, done by you.
- **Export.** Settings → *Export everything* produces one archive containing
  every entry as JSON, every recording, every photo and clip, and a plain
  HTML page that lists every memory by day with its photos and play buttons
  for her voice and her clips. With video the archive can run to many
  gigabytes, so it is built on the server and comes down in parts. It is
  readable in any browser with no app and no account. This is the
  independence guarantee: if the service, the company, or the app
  disappears, the diary does not.
- **Import.** Settings → *Import an archive* loads an export onto a device,
  merging by entry id so nothing duplicates.

## 7. What the app derives, and how

After a transcript arrives, a background job reads the text and produces:

- **People**: proper names mentioned, matched against the names list you
  provide so spellings stay consistent.
- **Places**: named places (*the lake*, *Mum's house*, *Café Rosa*).
- **Keywords**: three to eight plain words that would help find this later.
- **A short title**: five words or fewer, used only as a hint on cards when
  the text is long.

None of this is shown as something to manage. People and places appear as
chips on the memory screen. Keywords are invisible and only feed search. If
the extraction is wrong, editing the text re-runs it; nothing is ever
required of her to fix it.

The names list is also given to the transcriber, which fixes most
mis-heard names at the source.

Location capture (where she was) is **not** in version 1. It is the most
likely next addition if "the lake" turns out not to be enough.

## 8. Screens

There are five. There is no navigation bar, no tabs and no menu.

1. **Home** — search field, *Write*, today's moments, the stream, the
   *Remember* button fixed at the bottom.
2. **Recording** — Home with the button in its recording state. Not really a
   separate screen.
3. **Showback / Edit** — the text, *Add a photo or video*, thumbnails, *That's it*,
   and when editing an old memory, *Delete* at the bottom.
4. **Memory** — one memory in full, with *Play* and *Edit*.
5. **Settings** — reached from a small gear on Home. Nudge on/off and time,
   backup status, export, import, the names list, and sign out hidden at
   the bottom. This screen is for you more than her.

Visual rules:

- Body text 20px minimum. Entry text 22px. One typeface, generous line
  height.
- Follows the phone's light or dark setting. One accent colour, coral, on lavender-white paper with plum ink (deep plum in dark mode), the same family as the Ember icon. Changed from cream and terracotta on 20 October 2026 at his request.
- Every tappable thing is at least 56px tall. The *Remember* button is at
  least 120px.
- Primary actions sit in the bottom third of the screen for one-handed
  reach on a Pro Max.
- Every icon has a word next to it. Nothing is swipe-only.
- No modals. No spinners that block. Things that are still happening are
  described in a sentence (*Writing it down…*, *Backing up…*).

## 9. Technical approach

Same stack as Atlas so the tooling is already on the machine.

**App:** Vite, React 19, TypeScript, vite-plugin-pwa. Installed to the home
screen as a standalone web app. Hosted on Netlify at the `keepsakediary.net` custom
domain (see section 4).

**On the phone:**

- Entries and media in IndexedDB. The app is local-first: everything reads
  from the phone and syncs behind the scenes.
- Audio via `MediaRecorder` in AAC (`audio/mp4`), mono, about 0.5MB per
  minute.
- Camera and library via a file input accepting images and video, which
  gives the native *Take Photo or Video / Photo Library* sheet. Multiple
  selection from the library.
- Photo resizing on-device with a canvas before storage.
- Video stored as received (iPhone clips are HEVC or H.264 in a `.mov`
  container, roughly 60 to 150MB per minute depending on her camera
  settings). No transcoding on the phone; a browser cannot do it reliably.
  The filming date is read from the file's metadata when present, otherwise
  from the file's modified time. Poster frame drawn on-device from the first
  second.
- Video is not kept on the phone beyond a small recent cache. Older clips
  stream from the cloud and will not play offline. Photos and audio stay
  local.
- Search via a small in-memory index rebuilt from IndexedDB on launch.
- A persisted upload queue. iOS does not run web apps in the background, so
  uploads happen while the app is open and resume on the next open.

**Backend:**

- **Supabase** for the database (entries, derived fields, push
  subscriptions), file storage (audio, photos) and sign-in (email code).
  One account, hers.
- **Netlify Functions** for: transcription (audio in, text out, names list
  as a hint), extraction (text in, people/places/keywords/title out), export
  (build the archive), and sending push notifications.
- **A Netlify scheduled function** that runs each evening, checks whether
  today has an entry, and sends the nudge if not.
- **Transcription** by a hosted speech-to-text API (Whisper-class). Chosen
  during the build on accuracy with her voice and the names list.
- **Extraction** by a Claude model, small and fast, with a strict JSON
  output.
- **Push** via standard Web Push with VAPID keys. Works on iOS for
  home-screen web apps once permission is granted inside the installed app.

**Sign-in:** email plus six-digit code, typed into the app. Magic links are
avoided on purpose: on iOS they open in Safari, which does not share a
session with the installed app. Sessions are long-lived; she is never
signed out.

**Privacy:** audio and photos pass through the transcription and storage
services. Nothing is shared with anyone else. The cloud copy is private to
her account. The export is hers to keep anywhere.

## 10. Setup, done once by you

1. Open `https://keepsakediary.net` in Safari on her phone, *Add to Home Screen*.
2. Open the installed app, sign in with her email and the code.
3. Tap *Remember* once so iOS asks for the microphone, and allow it.
4. In Settings, turn on the nudge (iOS asks for notification permission),
   set the time, and paste the names list.
5. Take one test photo so iOS asks for the camera, and allow it.

Five minutes. After that she only ever sees Home.

## 11. Not in version 1

Deliberately left out. Each is small on its own and together they would
blur the thing.

- Caregiver or family view, sharing, multiple accounts.
- Suggesting photos from the camera roll.
- Importing the old video archive in bulk as memories dated when they were
  filmed. Decided against on 20 October 2026; old clips come in one at a
  time, attached to what she says about them today.
- Location capture and place-based search.
- The diary asking follow-up questions.
- Calendar view, "on this day" cards, statistics of any kind.
- Reminders at other times of day.
- Languages other than English.
- Any lock, PIN or Face ID inside the app.

## 12. Risks to prove early

These get tested on her actual phone in the first prototype, before the
backend exists.

| Risk | Why it matters | How we check |
|---|---|---|
| iOS re-asks for microphone permission on every launch of an installed web app | Would add a tap and a decision every single time | First prototype, her phone, ten launches |
| Recording is killed when the phone locks | Must save what was captured, not lose it | Record, lock mid-sentence, reopen |
| Transcription mangles names | Names are the main search key | Test with the names list and her voice |
| Notification permission or delivery is unreliable in the installed app | The nudge silently never fires | Set nudge for two minutes ahead, lock the phone |
| Photos and audio fill the device cache | App gets slow or iOS evicts data | Cache thumbnails, fetch full media on demand, measure |
| A three-minute clip is 100MB+ and uploads only while the app is open | Backup lags for hours; she closes the app mid-upload | Resumable uploads in chunks, *Backing up…* line on Home, test on cellular |
| HEVC clips do not play in non-Apple browsers | The export's HTML page is silent on a Windows PC | Note it in the export; convert to H.264 server-side if it matters later |
| Long recordings exceed the function timeout | Transcript never arrives for a ten-minute recording | App retries after three minutes; move transcription to a background function if long recordings are common |
| She finds the showback a step too many | Would break the two-tap promise | Watch her use it. Make *That's it* unnecessary by default. |

## 13. How we know it is working

Checked a month after she starts using it, from the data and from asking her.

- Most days of the week have at least one moment.
- The time from opening the app to a saved entry is under ten seconds,
  nearly every time.
- Moments are captured across the day, not bunched in the evening.
- She opens old memories at least once a week without being asked to.
- Zero lost entries.
- She says it is easy. That is the one that counts.

## 14. Build plan

Each stage ends with her using it on her phone before the next begins.

| Stage | What exists at the end | What she tells us |
|---|---|---|
| 0 · Storyboard | The five screens as a static walkthrough she can tap through on her phone, plus three icon candidates on her home screen | Does the flow feel right? What is the button called? What is the app called? Which icon? |
| 1 · Capture | Real recording, typing and photos, saved on the phone only. No backend. | Is it genuinely effortless? Does the showback help or get in the way? |
| 2 · Memory | Transcription, cloud backup, sign-in. The stream and search work. | Can she find a moment from a week ago by a name or a word? |
| 3 · Daily life | The nudge, people and place chips, replay polish. | Does the nudge feel kind? Are the chips helpful or clinical? |
| 4 · Safety | Export, import, new-phone restore tested end to end. | Nothing to ask her. This one is for you. |

## 15. Questions for the storyboard session with her

These are the things only she can answer. We take the storyboard to her
and ask, in roughly this order.

1. ~~What would you call it?~~ Answered: Keepsake, with *Remember* on the button.
2. Show the Home screen cold. What do you think the big button does?
3. After *Done*, would you rather see the words appear, or just be back
   home?
4. Photo before words, or words then photo? (We've assumed words first.)
   And when she adds one of the old clips of the boys, what would she want
   to say over it?
5. A message in the evening if you haven't kept anything that day. Would
   that feel kind or nagging? What should it say? What time?
6. When you open an old moment, does seeing *with Margaret · at the lake*
   feel helpful?
7. Light or dark?
8. Would you ever want to delete one? What should happen if you tap delete
   by mistake?
9. Imagine you want to find the day you had lunch with Margaret, three
   weeks ago. Show me what you'd do.
