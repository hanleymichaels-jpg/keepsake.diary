import { useEffect, useState } from 'react'
import { useStore } from '../state'
import { go } from '../App'

const get = (k: string, d: string) => localStorage.getItem(k) ?? d

export function Settings() {
  const { entries } = useStore()
  const [nudge, setNudge] = useState(get('nudgeOn', '1') === '1')
  const [time, setTime] = useState(get('nudgeTime', '19:30'))
  const [names, setNames] = useState(get('names', ''))
  const [note, setNote] = useState('')

  useEffect(() => { localStorage.setItem('nudgeOn', nudge ? '1' : '0') }, [nudge])
  useEffect(() => { localStorage.setItem('nudgeTime', time) }, [time])
  useEffect(() => { localStorage.setItem('names', names) }, [names])

  return (
    <div className="screen screen--pad">
      <div className="topbar">
        <button className="btn btn--quiet" onClick={() => go('')}>‹ Back</button>
      </div>
      <h1 className="h1">Settings</h1>

      <div className="row">
        <div>
          <div className="row__label">Evening reminder</div>
          <div className="row__sub">Only on days with nothing kept yet. Arrives in stage 3.</div>
        </div>
        <button className={`switch ${nudge ? 'switch--on' : ''}`} aria-label="Evening reminder" onClick={() => setNudge((n) => !n)} />
      </div>
      {nudge && (
        <>
          <div className="row">
            <div className="row__label">At</div>
            <input className="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div style={{ margin: '14px 0 6px' }} className="row__sub">How it will look on the lock screen</div>
          <div className="notice">
            <img className="notice__icon" src="/icons/icon-192.png" alt="" />
            <div>
              <div className="notice__title">Keepsake</div>
              <div className="notice__body">Anything from today?</div>
            </div>
          </div>
        </>
      )}

      <div className="row" style={{ marginTop: 18 }}>
        <div>
          <div className="row__label">Backup</div>
          <div className="row__sub">{entries.length} moments on this phone. Cloud backup arrives in stage 2.</div>
        </div>
      </div>
      <div className="row">
        <div className="row__label">Export everything</div>
        <button className="btn" onClick={() => setNote('Export arrives in stage 4.')}>Export</button>
      </div>
      <div className="row">
        <div className="row__label">Import an archive</div>
        <button className="btn" onClick={() => setNote('Import arrives in stage 4.')}>Import</button>
      </div>
      {note && <div className="row__sub" style={{ padding: '8px 0' }}>{note}</div>}

      <div style={{ marginTop: 22 }}>
        <div className="row__label">Her people</div>
        <div className="row__sub" style={{ marginBottom: 8 }}>One name per line or separated by commas. Helps the diary spell names right and find them later.</div>
        <textarea className="names" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Margaret, Tom, Anna" />
      </div>

      <div className="row" style={{ marginTop: 18 }}>
        <div className="row__label">Icon candidates</div>
        <button className="btn" onClick={() => go('icons')}>Look</button>
      </div>
    </div>
  )
}
