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
  /** The raw transcript, kept even if she edits the text. */
  transcript?: string
  source: 'voice' | 'typed'
  audio?: { id: string; seconds: number; type: string }
  /** True while the transcript has not arrived. */
  transcribing?: boolean
  media: Media[]
  people: string[]
  places: string[]
  keywords: string[]
  title?: string

  // Local-only bookkeeping, never sent to the server.
  /** Changed on this phone and not yet backed up. */
  dirty?: boolean
  /** Text edited locally; ask the server to re-derive people/places. */
  needsExtract?: boolean
  /** When we last asked the server to transcribe this entry. */
  transcribeRequestedAt?: number
}
