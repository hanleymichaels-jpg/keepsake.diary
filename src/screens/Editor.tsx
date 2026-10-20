import { useEffect, useRef, useState } from 'react'
import { useStore, newId } from '../state'
import { fullDate } from '../format'
import { PhotoPicker } from '../components/PhotoPicker'
import { MediaThumb } from '../components/MediaThumb'
import { Toast } from '../components/Toast'
import { go } from '../App'
import { isConfigured } from '../supabase'

/** Showback after a recording, the Write screen, and Edit on an old memory are
 *  all this one screen. The entry is already saved; this just lets her change it. */
export function Editor({ id: existingId, fresh = false }: { id?: string; fresh?: boolean }) {
  const store = useStore()
  const { entries, ready } = store
  const [id] = useState(() => existingId ?? newId())
  const entry = entries.find((e) => e.id === id)
  const isNewTyped = !existingId
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null)
  const area = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (isNewTyped) area.current?.focus() }, [isNewTyped])

  async function ensure() {
    if (entry) return entry
    const e = { id, at: Date.now(), updatedAt: Date.now(), text: '', source: 'typed' as const, media: [], people: [], places: [], keywords: [] }
    await store.add(e)
    return e
  }

  async function setText(text: string) {
    await ensure()
    await store.update(id, { text })
  }

  function done() {
    if (entry && !entry.text.trim() && entry.media.length === 0 && !entry.audio) store.remove(id)
    go('')
  }

  const canDelete = !!existingId && !fresh && !!entry

  if (existingId && ready && !entry) {
    return (
      <div className="screen screen--pad">
        <div className="topbar"><button className="btn btn--quiet" onClick={() => go('')}>‹ Back</button></div>
        <div className="empty">That memory isn’t here any more.</div>
      </div>
    )
  }

  return (
    <div className="screen screen--sticky-footer">
      <div className="topbar">
        <button className="btn btn--quiet" onClick={() => history.back()}>‹ Back</button>
      </div>
      <h1 className="h1">{entry ? fullDate(entry.at) : 'Right now'}</h1>

      {entry?.audio && !entry.text && entry.transcribing && (
        <div className="row__sub" style={{ marginBottom: 10 }}>{isConfigured ? 'Writing it down… You can type instead if you like.' : 'Your voice is kept. The words arrive once the backup is connected; you can type them for now.'}</div>
      )}
      <textarea
        ref={area}
        className="editor"
        placeholder="What happened?"
        value={entry?.text ?? ''}
        onChange={(e) => void setText(e.target.value)}
      />

      <div className="stack" style={{ marginTop: 14, flex: 'none' }}>
        <PhotoPicker
          onPick={async (items) => { await ensure(); await store.addMedia(id, items) }}
          onDeclined={(text) => setToast({ text })}
        />
        {entry && entry.media.length > 0 && (
          <div className="thumbs">
            {entry.media.map((m) => (
              <MediaThumb key={m.id} media={m} large onRemove={() => {
                void store.removeMedia(id, m.id)
                setToast({ text: m.kind === 'video' ? 'Clip removed' : 'Photo removed', undo: () => void store.update(id, { media: entry.media }) })
              }} />
            ))}
          </div>
        )}
        {canDelete && (
          <button className="btn btn--danger btn--block" style={{ marginTop: 40 }} onClick={() => {
            store.remove(id)
            sessionStorage.setItem('undo', id)
            go('')
          }}>Delete this memory</button>
        )}
      </div>

      <div className="footer">
        <button className="btn btn--primary btn--block" onClick={done}>That’s it</button>
      </div>

      {toast && (
        <Toast text={toast.text} action={toast.undo ? 'Undo' : undefined} onAction={toast.undo} onDone={() => setToast(null)} ms={toast.undo ? 5000 : 8000} />
      )}
    </div>
  )
}
