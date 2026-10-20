import type { Media } from './types'

export const MAX_CLIP_SECONDS = 180
const PHOTO_EDGE = 2048
const THUMB_EDGE = 320

export type Ingested = { meta: Media; blob: Blob; thumb: Blob; poster?: Blob }

const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

/** Turns picked files into stored media: photos resized, clips checked and given a poster frame. */
export async function ingestFiles(files: File[]): Promise<{ ok: Ingested[]; declined: string[] }> {
  const ok: Ingested[] = []
  const declined: string[] = []
  for (const f of files) {
    try {
      if (f.type.startsWith('video/')) {
        const r = await ingestVideo(f)
        if (r) ok.push(r)
        else declined.push(`That one is longer than ${MAX_CLIP_SECONDS / 60} minutes. Could you trim it in Photos first?`)
      } else if (f.type.startsWith('image/')) {
        ok.push(await ingestPhoto(f))
      } else declined.push('That isn’t a photo or a video.')
    } catch {
      declined.push('I couldn’t read that one.')
    }
  }
  return { ok, declined }
}

async function ingestPhoto(f: File): Promise<Ingested> {
  const img = await loadImage(f)
  const full = await draw(img, img.naturalWidth, img.naturalHeight, PHOTO_EDGE, 0.86)
  const thumb = await drawCover(img, img.naturalWidth, img.naturalHeight, THUMB_EDGE)
  return {
    meta: { id: newId(), kind: 'photo', width: full.width, height: full.height, takenAt: f.lastModified || undefined },
    blob: full.blob,
    thumb,
  }
}

async function ingestVideo(f: File): Promise<Ingested | null> {
  const url = URL.createObjectURL(f)
  try {
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'metadata'
    v.src = url
    await once(v, 'loadedmetadata')
    const duration = isFinite(v.duration) ? v.duration : 0
    if (duration > MAX_CLIP_SECONDS) return null
    // Grab a frame half a second in for the poster.
    v.currentTime = Math.min(0.5, duration / 2)
    await once(v, 'seeked')
    const w = v.videoWidth, h = v.videoHeight
    const poster = (await draw(v, w, h, 1280, 0.8)).blob
    const thumb = await drawCover(v, w, h, THUMB_EDGE)
    return {
      meta: { id: newId(), kind: 'video', duration: Math.round(duration), width: w, height: h, takenAt: f.lastModified || undefined },
      blob: f,
      thumb,
      poster,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(f: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')) }
    img.src = url
  })
}

function once(el: HTMLMediaElement, ev: string) {
  return new Promise<void>((resolve, reject) => {
    el.addEventListener(ev, () => resolve(), { once: true })
    el.addEventListener('error', () => reject(new Error('bad video')), { once: true })
  })
}

type Drawable = HTMLImageElement | HTMLVideoElement

async function draw(src: Drawable, sw: number, sh: number, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(sw, sh))
  const width = Math.round(sw * scale), height = Math.round(sh * scale)
  const c = document.createElement('canvas')
  c.width = width; c.height = height
  c.getContext('2d')!.drawImage(src, 0, 0, width, height)
  return { blob: await toJpeg(c, quality), width, height }
}

async function drawCover(src: Drawable, sw: number, sh: number, edge: number) {
  const side = Math.min(sw, sh)
  const sx = (sw - side) / 2, sy = (sh - side) / 2
  const c = document.createElement('canvas')
  c.width = edge; c.height = edge
  c.getContext('2d')!.drawImage(src, sx, sy, side, side, 0, 0, edge, edge)
  return toJpeg(c, 0.8)
}

function toJpeg(c: HTMLCanvasElement, q: number) {
  return new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', q),
  )
}
