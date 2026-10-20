import { useState } from 'react'
import { go } from '../App'

const CANDIDATES = [
  { key: 'ember', name: 'Ember', note: 'Plum cover, coral ribbon, a listening mark' },
  { key: 'linen', name: 'Linen', note: 'Cream diary on terracotta, a spark' },
  { key: 'fern', name: 'Fern', note: 'Forest cover, gold clasp and ribbon' },
]

const NEIGHBOURS: [string, string][] = [
  ['Messages', '#34c759'], ['Photos', '#ffffff'], ['Maps', '#5ac8fa'], ['Calendar', '#ffffff'],
  ['Mail', '#1e90ff'], ['Notes', '#ffd60a'], ['Camera', '#8e8e93'], ['Weather', '#2f80ed'],
]

export function Icons() {
  const [chosen, setChosen] = useState<string>(() => localStorage.getItem('icon') ?? '')

  const wall = (cls: string) => (
    <div className={`wall ${cls}`}>
      <div className="grid">
        {CANDIDATES.map((c) => (
          <div className="app" key={c.key}>
            <div className="app__icon"><img src={`/icons/candidates/${c.key}.svg`} alt={c.name} /></div>
            Keepsake
          </div>
        ))}
        {NEIGHBOURS.map(([n, color], i) => (
          <div className="app" key={n + i}>
            <div className="app__blank" style={{ background: color, opacity: .9 }} />
            {n}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="screen screen--pad">
      <div className="topbar">
        <button className="btn btn--quiet" onClick={() => go('settings')}>‹ Back</button>
      </div>
      <h1 className="h1">Which one?</h1>
      <p className="row__sub" style={{ marginBottom: 16 }}>Shown at home-screen size next to other apps, in light and dark.</p>
      {wall('wall--light')}
      {wall('wall--dark')}
      <div className="candidates">
        {CANDIDATES.map((c) => (
          <div className={`candidate ${chosen === c.key ? 'candidate--chosen' : ''}`} key={c.key}>
            <img src={`/icons/candidates/${c.key}.svg`} alt="" />
            <div className="candidate__name">{c.name}</div>
            <div className="row__sub" style={{ textAlign: 'center', fontSize: 15 }}>{c.note}</div>
            <button className="candidate__pick" onClick={() => { setChosen(c.key); localStorage.setItem('icon', c.key) }}>
              {chosen === c.key ? '✓ This one' : 'Pick'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
