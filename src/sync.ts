/**
 * Local-first sync. The phone's database is the truth she sees; this module
 * pushes changes to Supabase when it can and pulls what the server changed
 * (transcripts, extraction, edits from another device).
 */
import { supabase, isConfigured } from './supabase'
import * as db from './db'
import type { Entry } from './types'
import { useEffect, useState } from 'react'

export type SyncStatus = {
  connected: boolean
  syncing: boolean
  pending: number
  lastSync?: number
  error?: string
}

type Sink = { put: (e: Entry) => void; drop: (id: string) => void }
let sink: Sink | null = null
export const registerSink = (s: Sink | null) => { sink = s }

let status: SyncStatus = { connected: isConfigured, syncing: false, pending: 0 }
const listeners = new Set<(s: SyncStatus) => void>()
function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch }
  listeners.forEach((l) => l(status))
}
export function useSyncStatus() {
  const [s, setS] = useState(status)
  useEffect(() => { listeners.add(setS); return () => { listeners.delete(setS) } }, [])
  return s
}

const LOCAL_ONLY: (keyof Entry)[] = ['dirty', 'needsExtract', 'transcribeRequestedAt']

function toRow(e: Entry, userId: string) {
  const row: Record<string, unknown> = {
    id: e.id, user_id: userId, at: e.at, updated_at: e.updatedAt, deleted_at: null,
    text: e.text, transcript: e.transcript ?? null, source: e.source, audio: e.audio ?? null,
    transcribing: Boolean(e.transcribing), media: e.media,
    people: e.people, places: e.places, keywords: e.keywords, title: e.title ?? null,
  }
  return row
}

function fromRow(r: Record<string, unknown>): Entry {
  return {
    id: r.id as string, at: Number(r.at), updatedAt: Number(r.updated_at),
    text: (r.text as string) ?? '', transcript: (r.transcript as string | null) ?? undefined,
    source: r.source as Entry['source'], audio: (r.audio as Entry['audio']) ?? undefined,
    transcribing: Boolean(r.transcribing), media: (r.media as Entry['media']) ?? [],
    people: (r.people as string[]) ?? [], places: (r.places as string[]) ?? [], keywords: (r.keywords as string[]) ?? [],
    title: (r.title as string | null) ?? undefined,
  }
}

async function countPending() {
  const dirty = (await db.loadEntries()).filter((e) => e.dirty).length
  return dirty + (await db.getTombstones()).length
}

let timer: number | undefined
export function scheduleSync(delay = 1500) {
  if (!supabase) return
  clearTimeout(timer)
  timer = window.setTimeout(() => void syncNow(), delay)
  void countPending().then((pending) => setStatus({ pending }))
}

let running: Promise<void> | null = null
export function syncNow(): Promise<void> {
  if (!supabase) return Promise.resolve()
  running ??= run().finally(() => { running = null })
  return running
}

async function run() {
  const { data } = await supabase!.auth.getSession()
  const session = data.session
  if (!session || !navigator.onLine) return
  setStatus({ syncing: true, error: undefined })
  try {
    await pull()
    await push(session.user.id, session.access_token)
    setStatus({ lastSync: Date.now(), pending: await countPending() })
  } catch (e) {
    setStatus({ error: e instanceof Error ? e.message : String(e) })
  } finally {
    setStatus({ syncing: false })
  }
}

async function pull() {
  const since = (await db.getMeta<number>('lastPull')) ?? 0
  let cursor = since
  for (;;) {
    const { data, error } = await supabase!.from('entries').select('*').gt('updated_at', cursor).order('updated_at', { ascending: true }).limit(200)
    if (error) throw error
    if (!data?.length) break
    for (const row of data as Record<string, unknown>[]) {
      const id = row.id as string
      const local = await db.getEntry(id)
      if (row.deleted_at) {
        if (local) { await db.deleteEntry(local); sink?.drop(id) }
        await db.removeTombstone(id)
      } else {
        const remote = fromRow(row)
        await db.markUploaded(db.blobIdsOf(remote))
        if (!local) {
          await db.putEntry(remote); sink?.put(remote)
        } else if (remote.updatedAt > local.updatedAt) {
          const merged: Entry = local.dirty
            ? { ...remote, text: local.text || remote.text, media: local.media,
                people: local.text ? local.people : remote.people,
                places: local.text ? local.places : remote.places,
                keywords: local.text ? local.keywords : remote.keywords,
                transcribing: remote.transcribing && !local.text,
                dirty: true, needsExtract: local.needsExtract }
            : { ...remote }
          await db.putEntry(merged); sink?.put(merged)
        }
      }
      cursor = Math.max(cursor, Number(row.updated_at))
    }
    await db.setMeta('lastPull', cursor)
    if (data.length < 200) break
  }
}

async function push(userId: string, token: string) {
  for (const t of await db.getTombstones()) {
    const { error } = await supabase!.from('entries').update({ deleted_at: t.deletedAt, updated_at: t.deletedAt }).eq('id', t.id)
    if (error) throw error
    await db.removeTombstone(t.id)
  }
  for (const e of await db.getDirtyEntries()) {
    if (e.dirty) {
      for (const blobId of db.blobIdsOf(e)) {
        if (await db.isUploaded(blobId)) continue
        const blob = await db.getBlob(blobId)
        if (!blob) continue
        const { error } = await supabase!.storage.from('media').upload(`${userId}/${blobId}`, blob, { upsert: true, contentType: blob.type || 'application/octet-stream' })
        if (error) throw error
        await db.markUploaded([blobId])
      }
      const { error } = await supabase!.from('entries').upsert(toRow(e, userId))
      if (error) throw error
      // Clear dirty only if nothing changed while we were uploading.
      const now = await db.getEntry(e.id)
      if (now && now.updatedAt === e.updatedAt) {
        const clean = { ...now, dirty: false }
        await db.putEntry(clean); sink?.put(clean)
      }
      setStatus({ pending: await countPending() })
    }
    if (e.audio && e.transcribing && !e.text) {
      const stale = !e.transcribeRequestedAt || Date.now() - e.transcribeRequestedAt > 3 * 60_000
      if (stale) {
        const now = await db.getEntry(e.id)
        if (now) await db.putEntry({ ...now, transcribeRequestedAt: Date.now() })
        void callFunction('/api/transcribe', { id: e.id }, token).then(async (status) => {
          if (status === 404) {
            // The server has no row for this moment yet; send it again next time.
            const n = await db.getEntry(e.id)
            if (n) { await db.putEntry({ ...n, dirty: true, transcribeRequestedAt: undefined }); scheduleSync() }
          } else pollSoon()
        })
      }
    } else if (e.needsExtract && e.text.trim()) {
      const now = await db.getEntry(e.id)
      if (now) { const n = { ...now, needsExtract: false }; await db.putEntry(n); sink?.put(n) }
      void callFunction('/api/extract', { id: e.id }, token).then(() => pollSoon())
    }
  }
}

async function callFunction(path: string, body: unknown, token: string): Promise<number> {
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
    if (!res.ok) setStatus({ error: `${path} ${res.status}` })
    return res.status
  } catch (e) {
    setStatus({ error: e instanceof Error ? e.message : String(e) })
    return 0
  }
}

/** After asking the server for work, look for its answer a few times. */
function pollSoon() {
  for (const ms of [1500, 5000, 12000, 30000]) window.setTimeout(() => void syncNow(), ms)
}

/** Fetch a blob that another device uploaded (or that was evicted here). */
export async function fetchRemoteBlob(id: string): Promise<Blob | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const uid = data.session?.user.id
  if (!uid) return null
  const { data: blob, error } = await supabase.storage.from('media').download(`${uid}/${id}`)
  if (error || !blob) return null
  await db.putBlob(id, blob)
  await db.markUploaded([id])
  return blob
}

export async function pushSettings(s: { names: string; nudgeOn: boolean; nudgeTime: string }) {
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  const uid = data.session?.user.id
  if (!uid) return
  await supabase.from('settings').upsert({ user_id: uid, names: s.names, nudge_on: s.nudgeOn, nudge_time: s.nudgeTime, updated_at: Date.now() })
}

export async function pullSettings(): Promise<{ names: string; nudgeOn: boolean; nudgeTime: string } | null> {
  if (!supabase) return null
  const { data } = await supabase.from('settings').select('*').maybeSingle()
  if (!data) return null
  return { names: data.names ?? '', nudgeOn: data.nudge_on ?? true, nudgeTime: data.nudge_time ?? '19:30' }
}

let started = false
export function startSync() {
  if (started || !supabase) return
  started = true
  const kick = () => scheduleSync(300)
  window.addEventListener('online', kick)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') kick() })
  window.setInterval(kick, 60_000)
  kick()
}

export const localOnlyFields = LOCAL_ONLY
