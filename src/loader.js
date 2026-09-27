import { rng } from './rng.js'

// Loads an image for use as a wall texture, but never lets a broken or slow one hold up the gallery: a
// failed load, a CORS refusal, or one that just never responds within the timeout all resolve to
// { ok: false } instead of throwing or hanging, so the caller can put up a placeholder and move on.

export function defaultLoadImage(url) {
 return new Promise((resolve, reject) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => resolve(img)
  img.onerror = reject
  img.src = url
 })
}

export async function loadWithFallback(url, { loadImage = defaultLoadImage, timeoutMs = 7000 } = {}) {
 try {
  const image = await Promise.race([
   loadImage(url),
   new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
  ])
  return { ok: true, image }
 } catch { return { ok: false } }
}

// A deterministic color for the placeholder a piece gets when its real image cannot be loaded --
// picked from its own title/creator, so the same un-loadable piece always looks the same way, rather
// than flashing a different color on every visit.
export function placeholderColor(seedText) {
 const rand = rng(seedText)
 const hue = Math.floor(rand() * 360)
 return `hsl(${hue}, 35%, 28%)`
}
