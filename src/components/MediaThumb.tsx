import { useBlobUrl } from '../state'
import { thumbId } from '../db'
import type { Media } from '../types'
import { duration } from '../format'

export function MediaThumb({ media, large, onRemove }: { media: Media; large?: boolean; onRemove?: () => void }) {
  const url = useBlobUrl(thumbId(media.id))
  return (
    <div className={`thumb ${large ? 'thumb--lg' : ''}`}>
      {url && <img src={url} alt="" />}
      {media.kind === 'video' && <span className="thumb__clip">▶ {duration(media.duration ?? 0)}</span>}
      {onRemove && <button className="thumb__x" aria-label="Remove" onClick={onRemove}>×</button>}
    </div>
  )
}
