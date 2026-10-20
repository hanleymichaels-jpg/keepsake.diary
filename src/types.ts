export type Media = {
  id: string
  kind: 'photo' | 'video'
  /** Seconds, video only. */
  duration?: number
  /** When the clip or photo was taken, if known (library picks keep their original date). */
  takenAt?: number
  width?: number
  height?: number
}

export type Entry = {
  id: string
  /** The moment: when recording started or the first word was typed. */
  at: number
  updatedAt: number
  text: string
  source: 'voice' | 'typed'
  audio?: { id: string; seconds: number; type: string }
  /** True while the transcript has not arrived. Stage 2 sets it false. */
  transcribing?: boolean
  media: Media[]
  people: string[]
  places: string[]
  keywords: string[]
}
