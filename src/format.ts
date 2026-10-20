const DAY = 86_400_000

const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** "Today", "Yesterday", "Tuesday 14 October", "Tuesday 14 October 2025". */
export function dayLabel(t: number, now = Date.now()) {
  const diff = Math.round((startOfDay(now) - startOfDay(t)) / DAY)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  const d = new Date(t)
  const base = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  return d.getFullYear() === new Date(now).getFullYear() ? base : `${base} ${d.getFullYear()}`
}

export const timeLabel = (t: number) =>
  new Date(t).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '').toLowerCase()

export const fullDate = (t: number) => `${dayLabel(t)} at ${timeLabel(t)}`

/** Words a search can match against for a date: "tuesday 14 october 2026". */
export const dateWords = (t: number) =>
  new Date(t).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase()

export const duration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export const dayKey = (t: number) => startOfDay(t)

export const monthYear = (t: number) => new Date(t).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
