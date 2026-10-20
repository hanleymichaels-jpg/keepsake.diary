/** Microphone recording with MediaRecorder. iOS Safari records AAC in audio/mp4;
 *  desktop Chrome records Opus in webm, which is fine for testing. */
export type Recording = {
  startedAt: number
  type: string
  /** Stops the recorder and resolves with what was captured, even if interrupted. */
  stop: () => Promise<{ blob: Blob; seconds: number }>
}

export class MicError extends Error {}

function pickType() {
  for (const t of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

export async function startRecording(): Promise<Recording> {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    throw new MicError('This phone cannot record here.')
  }
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (e) {
    const name = (e as DOMException)?.name
    throw new MicError(
      name === 'NotAllowedError'
        ? 'The microphone is switched off for Keepsake. Settings → Keepsake → Microphone turns it on.'
        : 'I couldn’t reach the microphone just now.',
    )
  }
  const type = pickType()
  const rec = type ? new MediaRecorder(stream, { mimeType: type }) : new MediaRecorder(stream)
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
  const startedAt = Date.now()
  rec.start(1000) // a chunk every second, so an interrupted recording still has data

  let stopped: Promise<{ blob: Blob; seconds: number }> | null = null
  const stop = () => {
    stopped ??= new Promise((resolve) => {
      const finish = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: rec.mimeType || type || 'audio/mp4' })
        resolve({ blob, seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)) })
      }
      if (rec.state === 'inactive') finish()
      else {
        rec.onstop = finish
        try { rec.stop() } catch { finish() }
      }
    })
    return stopped
  }
  return { startedAt, type: rec.mimeType || type, stop }
}
