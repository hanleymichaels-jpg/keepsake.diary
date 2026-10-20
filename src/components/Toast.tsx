import { useEffect } from 'react'

export function Toast({ text, action, onAction, onDone, ms = 5000 }: {
  text: string
  action?: string
  onAction?: () => void
  onDone: () => void
  ms?: number
}) {
  useEffect(() => {
    const t = setTimeout(onDone, ms)
    return () => clearTimeout(t)
  }, [onDone, ms])
  return (
    <div className="toast" role="status">
      <span>{text}</span>
      {action && (
        <button onClick={() => { onAction?.(); onDone() }}>{action}</button>
      )}
    </div>
  )
}
