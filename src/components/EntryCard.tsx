import type { Entry } from '../state'
import { timeLabel, duration } from '../format'
import { go } from '../App'
import { MediaThumb } from './MediaThumb'

export function EntryCard({ entry }: { entry: Entry }) {
  return (
    <button className="card" onClick={() => go(`memory/${entry.id}`)}>
      <div className="card__meta">
        <span>{timeLabel(entry.at)}</span>
        {entry.audio && <span>▶ {duration(entry.audio.seconds)}</span>}
      </div>
      {entry.text ? (
        <div className="card__text">{entry.text}</div>
      ) : entry.audio ? (
        <div className="card__text card__text--pending">Waiting to be written down</div>
      ) : null}
      {entry.media.length > 0 && (
        <div className="thumbs">
          {entry.media.map((m) => <MediaThumb key={m.id} media={m} />)}
        </div>
      )}
    </button>
  )
}
