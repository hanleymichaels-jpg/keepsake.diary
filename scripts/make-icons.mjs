// Renders one icon candidate (default: ember) to every size iOS and the manifest need.
// Usage: node scripts/make-icons.mjs [ember|linen|fern]
import sharp from 'sharp'
import { mkdirSync, readFileSync } from 'node:fs'

const name = process.argv[2] ?? 'ember'
const svg = readFileSync(`public/icons/candidates/${name}.svg`)

// Maskable icons need extra safe padding: scale the artwork down onto its own background.
async function render(size, inset, out) {
  if (!inset) return sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(out)
  const bg = /<rect width="1024" height="1024" fill="(#[0-9A-Fa-f]{6})"/.exec(svg.toString())?.[1] ?? '#000'
  const inner = Math.round(size * (1 - inset * 2))
  const art = await sharp(svg).resize(inner, inner).png().toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: art, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(out)
}

mkdirSync('public/icons', { recursive: true })
await Promise.all([
  render(192, 0, 'public/icons/icon-192.png'),
  render(512, 0, 'public/icons/icon-512.png'),
  render(512, 0.1, 'public/icons/icon-maskable-512.png'),
  render(180, 0, 'public/icons/apple-touch-icon.png'),
  render(64, 0, 'public/icons/favicon.png'),
])
console.log('✓ icons rendered from', name)
