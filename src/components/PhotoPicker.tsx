import { useRef, useState } from 'react'
import { ingestFiles, type Ingested } from '../media'

/** Opens the native iOS sheet (Take Photo or Video / Photo Library). */
export function PhotoPicker({ onPick, onDeclined }: { onPick: (items: Ingested[]) => Promise<void> | void; onDeclined: (msg: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <button className="btn btn--block" disabled={busy} onClick={() => ref.current?.click()}>
        <CameraGlyph /> {busy ? 'Adding…' : 'Add a photo or video'}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (!files.length) return
          setBusy(true)
          try {
            const { ok, declined } = await ingestFiles(files)
            if (ok.length) await onPick(ok)
            if (declined.length) onDeclined(declined[0])
          } finally {
            setBusy(false)
          }
        }}
      />
    </>
  )
}

function CameraGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}
