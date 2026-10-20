import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, newId, type Entry } from '../state'
import { startRecording, MicError, type Recording } from '../recorder'
import * as db from '../db'
import { dayLabel, dayKey, dateWords, duration } from '../format'
import { EntryCard } from '../components/EntryCard'
import { Toast } from '../components/Toast'
import { go } from '../App'
import { useSyncStatus } from '../sync'

const MAX_SECONDS = 600

export function Home() {
  const { ready, entries, add, restore } = useStore()
  const sync = useSyncStatus()
  const [q, setQ] = useState(() => { const t = sessionStorage.getItem('q') ?? ''; sessionStorage.removeItem('q'); return t })
  const rec = useRef<Recording | null>(null)
  const [recording, setRecording] = useState(false)
  const [starting, setStarting] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [problem, setProblem] = useState('')
  // Arriving here right after "Delete this memory": offer Undo.
  const [undoId, setUndoId] = useState(() => { const u = sessionStorage.getItem('undo'); sessionStorage.removeItem('undo'); return u })

  async function start() {
    if (rec.current || starting) return
    setStarting(true)
    try {
      rec.current = await startRecording()
      setSeconds(0)
      setRecording(true)
    } catch (e) {
      setProblem(e instanceof MicError ? e.message : 'I couldn’t start recording.')
    } finally {
      setStarting(false)
    }
  }

  async function finish() {
    const r = rec.current
    if (!r) return
    rec.current = null
    setRecording(false)
    const id = newId()
    const { blob, seconds } = await r.stop()
    const entry: Entry = {
      id, at: r.startedAt, updatedAt: Date.now(), text: '', source: 'voice',
      audio: { id: `${id}:audio`, seconds, type: blob.type }, transcribing: true,
      media: [], people: [], places: [], keywords: [],
    }
    await db.putBlob(entry.audio!.id, blob)
    await add(entry)
    go(`show/${id}`)
  }

  // Timer, the ten-minute cap, and stop-and-save when the app is hidden (lock, call, app switch).
  useEffect(() => {
    if (!recording) return
    const tick = setInterval(() => {
      const s = Math.floor((Date.now() - (rec.current?.startedAt ?? Date.now())) / 1000)
      setSeconds(s)
      if (s >= MAX_SECONDS) void finish()
    }, 250)
    const onHide = () => { if (document.visibilityState === 'hidden') void finish() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      clearInterval(tick)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  })

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return entries
    return entries.filter((e) =>
      [e.text, ...e.people, ...e.places, ...e.keywords, dateWords(e.at)].join(' ').toLowerCase().includes(needle),
    )
  }, [entries, q])

  const days = useMemo(() => {
    const m = new Map<number, Entry[]>()
    for (const e of shown) m.set(dayKey(e.at), [...(m.get(dayKey(e.at)) ?? []), e])
    return Array.from(m.entries())
  }, [shown])

  return (
    <div className="screen screen--home">
      <div className="topbar">
        <input
          className="search"
          type="search"
          placeholder="Find a memory"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          enterKeyHint="search"
        />
        <button className="btn" onClick={() => go('new')}>Write</button>
        <button className="btn btn--quiet" aria-label="Settings" onClick={() => go('settings')}>
          <GearGlyph />
        </button>
      </div>

      {sync.syncing && sync.pending > 0 && <div className="row__sub" style={{ marginBottom: 8 }}>Backing up…</div>}
      {ready && days.length === 0 && (
        <div className="empty">{q ? `Nothing about “${q}” yet.` : 'Your moments will gather here.'}</div>
      )}
      {days.map(([key, list]) => (
        <section key={key}>
          <div className="day">{dayLabel(list[0].at)}</div>
          {list.map((e) => <EntryCard key={e.id} entry={e} />)}
        </section>
      ))}

      <div className="dock">
        <div className="dock__timer">{recording ? duration(seconds) : ''}</div>
        <button
          className={`remember ${recording ? 'remember--on' : ''}`}
          disabled={starting}
          onClick={recording ? () => void finish() : () => void start()}
        >
          {recording ? 'Done' : starting ? '…' : 'Remember'}
        </button>
        <div className="dock__hint">{recording ? 'I’m listening.' : ''}</div>
      </div>

      {problem && <Toast text={problem} onDone={() => setProblem('')} ms={8000} />}
      {undoId && <Toast text="Memory deleted" action="Undo" onAction={() => restore(undoId)} onDone={() => setUndoId(null)} />}
    </div>
  )
}

function GearGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  )
}
