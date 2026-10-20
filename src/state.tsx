import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import type { Entry, Media } from './types'
import { derive } from './derive'
import * as db from './db'
import type { Ingested } from './media'
import { registerSink, scheduleSync, fetchRemoteBlob } from './sync'

export type { Entry, Media }

type Action =
  | { type: 'loaded'; entries: Entry[] }
  | { type: 'put'; entry: Entry }
  | { type: 'drop'; id: string }

function reducer(entries: Entry[], a: Action): Entry[] {
  switch (a.type) {
    case 'loaded': return a.entries
    case 'put': return [...entries.filter((e) => e.id !== a.entry.id), a.entry].sort((x, y) => y.at - x.at)
    case 'drop': return entries.filter((e) => e.id !== a.id)
  }
}

type Store = {
  ready: boolean
  entries: Entry[]
  add: (entry: Entry) => Promise<void>
  update: (id: string, patch: Partial<Entry>) => Promise<void>
  addMedia: (id: string, items: Ingested[]) => Promise<void>
  removeMedia: (id: string, mediaId: string) => Promise<void>
  /** Soft delete with a window for Undo; the database is touched only after the window. */
  remove: (id: string) => void
  restore: (id: string) => boolean
}

const Ctx = createContext<Store | null>(null)
const UNDO_MS = 6000

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [entries, rawDispatch] = useReducer(reducer, [])
  const [ready, setReady] = useState(false)
  const pending = useMemo(() => new Map<string, { entry: Entry; timer: number }>(), [])
  // Mirror of the reducer state that updates synchronously, so back-to-back
  // actions (first keystroke right after creating the entry) never read a stale list.
  const latest = useRef<Entry[]>([])
  const dispatch = useCallback((a: Action) => { latest.current = reducer(latest.current, a); rawDispatch(a) }, [])

  useEffect(() => {
    db.loadEntries().then((list) => { dispatch({ type: 'loaded', entries: list }); setReady(true) })
    registerSink({ put: (e) => dispatch({ type: 'put', entry: e }), drop: (id) => dispatch({ type: 'drop', id }) })
    return () => registerSink(null)
  }, [dispatch])

  const find = useCallback((id: string) => latest.current.find((e) => e.id === id), [])

  const save = useCallback(async (entry: Entry) => {
    dispatch({ type: 'put', entry })
    await db.putEntry(entry)
    scheduleSync()
  }, [dispatch])

  const add = useCallback(async (entry: Entry) => {
    await save({ ...entry, dirty: true })
    void db.persistStorage()
  }, [save])

  const update = useCallback(async (id: string, patch: Partial<Entry>) => {
    const cur = find(id)
    if (!cur) return
    let next: Entry = { ...cur, ...patch, updatedAt: Date.now(), dirty: true }
    if (patch.text !== undefined && patch.text !== cur.text) next = { ...next, ...derive(patch.text), needsExtract: true }
    await save(next)
  }, [find, save])

  const addMedia = useCallback(async (id: string, items: Ingested[]) => {
    const cur = find(id)
    if (!cur || !items.length) return
    for (const it of items) {
      await db.putBlob(it.meta.id, it.blob)
      await db.putBlob(db.thumbId(it.meta.id), it.thumb)
      if (it.poster) await db.putBlob(db.posterId(it.meta.id), it.poster)
    }
    await save({ ...cur, media: [...cur.media, ...items.map((i) => i.meta)], updatedAt: Date.now(), dirty: true })
  }, [find, save])

  const removeMedia = useCallback(async (id: string, mediaId: string) => {
    const cur = find(id)
    if (!cur) return
    await save({ ...cur, media: cur.media.filter((m) => m.id !== mediaId), updatedAt: Date.now(), dirty: true })
    // Delete the files only if the photo is still gone once the Undo window has passed.
    window.setTimeout(() => {
      const stillUsed = latest.current.some((e) => e.media.some((m) => m.id === mediaId))
      if (!stillUsed) void db.deleteBlobs([mediaId, db.thumbId(mediaId), db.posterId(mediaId)])
    }, UNDO_MS + 1000)
  }, [find, save])

  const remove = useCallback((id: string) => {
    const cur = find(id)
    if (!cur) return
    dispatch({ type: 'drop', id })
    const timer = window.setTimeout(async () => {
      pending.delete(id)
      await db.deleteEntry(cur)
      await db.addTombstone(id, Date.now())
      scheduleSync()
    }, UNDO_MS)
    pending.set(id, { entry: cur, timer })
  }, [find, pending, dispatch])

  const restore = useCallback((id: string) => {
    const p = pending.get(id)
    if (!p) return false
    clearTimeout(p.timer)
    pending.delete(id)
    dispatch({ type: 'put', entry: p.entry })
    return true
  }, [pending, dispatch])

  const value = useMemo<Store>(() => ({ ready, entries, add, update, addMedia, removeMedia, remove, restore }),
    [ready, entries, add, update, addMedia, removeMedia, remove, restore])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('StoreProvider missing')
  return v
}

/** Object URL for a stored blob, cached for the session. Falls back to the cloud copy. */
const urlCache = new Map<string, Promise<string | null>>()
export function useBlobUrl(id: string | undefined) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!id) return
    let live = true
    let p = urlCache.get(id)
    if (!p) {
      p = db.getBlob(id)
        .then(async (b) => b ?? (await fetchRemoteBlob(id)))
        .then((b) => (b ? URL.createObjectURL(b) : null))
      urlCache.set(id, p)
      // Don't cache a miss forever: the blob may arrive later.
      p.then((u) => { if (!u) urlCache.delete(id) })
    }
    p.then((u) => { if (live) setUrl(u) })
    return () => { live = false }
  }, [id])
  return url
}
