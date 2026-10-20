import { useEffect, useRef, useState } from 'react'
import { useStore, useBlobUrl } from '../state'
import type { Media } from '../types'
import { posterId } from '../db'
import { fullDate, duration, monthYear } from '../format'
import { go } from '../App'

export function Memory({ id }: { id: string }) {
  const { entries, ready } = useStore()
  const entry = entries.find((e) => e.id === id)
  const [viewing, setViewing] = useState<Media | null>(null)

  if (!entry) return (
    <div className="screen screen--pad">
      <div className="topbar"><button className="btn btn--quiet" onClick={() => go('')}>‹ Back</button></div>
      {ready && <div className="empty">That memory isn’t here any more.</div>}
    </div>
  )

  return (
    <div className="screen screen--pad">
      <div className="topbar">
        <button className="btn btn--quiet" onClick={() => history.back()}>‹ Back</button>
        <div className="grow" />
        <button className="btn" onClick={() => go(`edit/${entry.id}`)}>Edit</button>
      </div>
      <h1 className="h1">{fullDate(entry.at)}</h1>
      {entry.text ? (
        <p className="entry-text">{entry.text}</p>
      ) : entry.audio ? (
        <p className="entry-text" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Writing it down…</p>
      ) : null}

      {entry.audio && <AudioPlayer blobId={entry.audio.id} seconds={entry.audio.seconds} />}

      {entry.media.length > 0 && (
        <div className="photos">
          {entry.media.map((m) => (
            m.kind === 'video'
              ? <VideoClip key={m.id} media={m} entryAt={entry.at} />
              : <Photo key={m.id} media={m} onOpen={() => setViewing(m)} />
          ))}
        </div>
      )}

      {(entry.people.length > 0 || entry.places.length > 0) && (
        <div className="chips">
          {entry.people.map((n) => <button className="chip" key={n} onClick={() => searchFor(n)}><span>with</span> {n}</button>)}
          {entry.places.map((n) => <button className="chip" key={n} onClick={() => searchFor(n)}><span>at</span> {n}</button>)}
        </div>
      )}

      {viewing && <Viewer media={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

function AudioPlayer({ blobId, seconds }: { blobId: string; seconds: number }) {
  const url = useBlobUrl(blobId)
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  useEffect(() => () => ref.current?.pause(), [])
  return (
    <div className="player">
      <audio
        ref={ref}
        src={url ?? undefined}
        preload="metadata"
        onTimeUpdate={(e) => { const a = e.currentTarget; if (!a.ended) setPos(a.currentTime) }}
        onEnded={() => { setPlaying(false); setPos(0) }}
        onPause={(e) => {
          const a = e.currentTarget
          setPlaying(false)
          // Some recordings report a slightly short duration and never fire "ended".
          if (a.ended || a.currentTime >= Math.min(a.duration || seconds, seconds) - 0.15) { setPos(0); a.currentTime = 0 }
        }}
        onPlay={() => setPlaying(true)}
      />
      <button className="btn btn--primary" style={{ minWidth: 150 }} disabled={!url} onClick={() => {
        const a = ref.current
        if (!a) return
        if (a.paused) void a.play()
        else a.pause()
      }}>
        {playing ? '❚❚ Pause' : `▶ Play · ${duration(seconds)}`}
      </button>
      <div className="player__bar"><div className="player__fill" style={{ width: `${seconds ? Math.min(100, (pos / seconds) * 100) : 0}%` }} /></div>
    </div>
  )
}

function Photo({ media, onOpen }: { media: Media; onOpen: () => void }) {
  const url = useBlobUrl(media.id)
  return (
    <button className="photo" onClick={onOpen} aria-label="Open photo">
      {url && <img src={url} alt="" />}
    </button>
  )
}

function VideoClip({ media, entryAt }: { media: Media; entryAt: number }) {
  const url = useBlobUrl(media.id)
  const poster = useBlobUrl(posterId(media.id))
  const old = media.takenAt && Math.abs(entryAt - media.takenAt) > 86_400_000
  return (
    <div>
      <video className="clip" src={url ?? undefined} poster={poster ?? undefined} controls playsInline preload="metadata" />
      {old && <div className="row__sub" style={{ marginTop: 6 }}>filmed {monthYear(media.takenAt!)}</div>}
    </div>
  )
}

function Viewer({ media, onClose }: { media: Media; onClose: () => void }) {
  const url = useBlobUrl(media.id)
  return (
    <div className="viewer" onClick={onClose}>
      {url && <img src={url} alt="" />}
      <button className="viewer__close" aria-label="Close">Close</button>
    </div>
  )
}

function searchFor(term: string) {
  sessionStorage.setItem('q', term)
  go('')
}
