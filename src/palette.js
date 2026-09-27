import { rng, pick } from './rng.js'

// A small palette for the "living painting" a piece opens into. The real one is sampled from the
// piece's own pixels when the browser will allow it (a cross-origin image can be canvas-tainted, in
// which case reading pixels throws); extractPalette is written so that path is testable without a real
// DOM by accepting a fake canvas/image loader, the same way music.test.js fakes an AudioContext.
// Whenever sampling is not possible, fallbackPalette makes something reasonable and fully deterministic
// from the piece's own title and creator, so a piece never opens into a blank or broken scene.

const SWATCH = 16 // sample a tiny canvas, not the full image -- plenty for "the mood of these colors"

export function fallbackPalette(seedText) {
 const rand = rng(seedText)
 const baseHue = Math.floor(rand() * 360)
 const spread = 40 + rand() * 60
 const colors = []
 for (let i = 0; i < 5; i++) {
  const hue = (baseHue + i * spread + rand() * 20 - 10 + 360) % 360
  const sat = 45 + rand() * 40
  const light = 30 + rand() * 45
  colors.push(hsl(hue, sat, light))
 }
 return colors
}

function hsl(h, s, l) {
 s /= 100; l /= 100
 const k = n => (n + h / 30) % 12
 const a = s * Math.min(l, 1 - l)
 const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
 const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0')
 return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

// Hue, 0..360, for bucketing -- not a full HSL conversion, just the angle, which is all bucketing needs.
function hueOf(r, g, b) {
 const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
 if (d === 0) return null // grayscale: no hue to bucket by
 let h
 if (max === r) h = ((g - b) / d) % 6
 else if (max === g) h = (b - r) / d + 2
 else h = (r - g) / d + 4
 h *= 60
 return h < 0 ? h + 360 : h
}

// Downsamples pixels into a handful of dominant colors by bucketing on hue (so red pixels and blue
// pixels land in different buckets, unlike a naive average) with a separate bucket for anything close
// to grayscale. The buckets actually present, largest first, are returned as real average colors --
// fast and dependency-free, and it separates real clusters instead of just re-finding the image's
// overall average tone.
export function dominantColors(pixels, count = 5) {
 const hueBuckets = Array.from({ length: count }, () => ({ r: 0, g: 0, b: 0, n: 0 }))
 const neutral = { r: 0, g: 0, b: 0, n: 0 }
 for (let i = 0; i < pixels.length; i += 4) {
  const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]]
  if (a < 40) continue
  const hue = hueOf(r, g, b)
  const bucket = hue == null ? neutral : hueBuckets[Math.min(count - 1, Math.floor((hue / 360) * count))]
  bucket.r += r; bucket.g += g; bucket.b += b; bucket.n++
 }
 const toHex = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
 const hex = b => `#${toHex(b.r / b.n)}${toHex(b.g / b.n)}${toHex(b.b / b.n)}`
 return [...hueBuckets, neutral].filter(b => b.n > 0).sort((a, b) => b.n - a.n).slice(0, count).map(hex)
}

// Tries to sample the real image; resolves to null (never rejects) if it cannot be read, so the caller
// always has fallbackPalette to reach for. `loadImage` and `createCanvas` are injectable for testing.
export async function extractPalette(url, { loadImage = defaultLoadImage, createCanvas = defaultCreateCanvas, timeoutMs = 4000 } = {}) {
 try {
  const img = await withTimeout(loadImage(url), timeoutMs)
  const canvas = createCanvas(SWATCH, SWATCH)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, SWATCH, SWATCH)
  const { data } = ctx.getImageData(0, 0, SWATCH, SWATCH)
  const colors = dominantColors(data)
  return colors.length ? colors : null
 } catch { return null }
}

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])

function defaultLoadImage(url) {
 return new Promise((resolve, reject) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => resolve(img)
  img.onerror = reject
  img.src = url
 })
}
function defaultCreateCanvas(w, h) {
 const c = document.createElement('canvas')
 c.width = w; c.height = h
 return c
}

// A palette either extracted or, failing that, guessed from the piece's own words -- either way, real
// and deterministic, never a call to a model.
export async function paletteFor(piece, opts) {
 return (await extractPalette(piece.thumbnail, opts)) || fallbackPalette(`${piece.title}|${piece.creator}`)
}

export const pickAccent = (palette, seedText) => pick(rng(`${seedText}|accent`), palette)
