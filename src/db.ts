import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Entry } from './types'

interface KeepsakeDB extends DBSchema {
  entries: { key: string; value: Entry; indexes: { at: number } }
  blobs: { key: string; value: { id: string; blob: Blob } }
}

let dbp: Promise<IDBPDatabase<KeepsakeDB>> | null = null

function db() {
  dbp ??= openDB<KeepsakeDB>('keepsake', 1, {
    upgrade(d) {
      d.createObjectStore('entries', { keyPath: 'id' }).createIndex('at', 'at')
      d.createObjectStore('blobs', { keyPath: 'id' })
    },
  })
  return dbp
}

export async function loadEntries(): Promise<Entry[]> {
  const all = await (await db()).getAllFromIndex('entries', 'at')
  return all.reverse()
}

export async function putEntry(e: Entry) {
  await (await db()).put('entries', e)
}

export async function deleteEntry(e: Entry) {
  const d = await db()
  const tx = d.transaction(['entries', 'blobs'], 'readwrite')
  await tx.objectStore('entries').delete(e.id)
  for (const id of blobIdsOf(e)) await tx.objectStore('blobs').delete(id)
  await tx.done
}

export async function putBlob(id: string, blob: Blob) {
  await (await db()).put('blobs', { id, blob })
}

export async function getBlob(id: string): Promise<Blob | undefined> {
  return (await (await db()).get('blobs', id))?.blob
}

export async function deleteBlobs(ids: string[]) {
  const d = await db()
  const tx = d.transaction('blobs', 'readwrite')
  for (const id of ids) await tx.store.delete(id)
  await tx.done
}

export function blobIdsOf(e: Entry): string[] {
  const ids: string[] = []
  if (e.audio) ids.push(e.audio.id)
  for (const m of e.media) ids.push(m.id, thumbId(m.id), posterId(m.id))
  return ids
}

export const thumbId = (id: string) => `${id}:thumb`
export const posterId = (id: string) => `${id}:poster`

/** Ask iOS not to evict the diary under storage pressure. Best effort. */
export async function persistStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch { /* unsupported */ }
}
