import test from 'node:test'
import assert from 'node:assert/strict'
import { fallbackPalette, dominantColors, extractPalette, paletteFor, paletteFromImage } from '../src/palette.js'

const isHex = c => /^#[0-9a-f]{6}$/.test(c)

test('fallbackPalette is a handful of valid hex colors, and is deterministic for the same text', () => {
 const a = fallbackPalette('Starry Night|Vincent van Gogh')
 const b = fallbackPalette('Starry Night|Vincent van Gogh')
 const c = fallbackPalette('Something else entirely')
 assert.equal(a.length, 5)
 assert.ok(a.every(isHex))
 assert.deepEqual(a, b)
 assert.notDeepEqual(a, c)
})

const hexToRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

test('dominantColors actually separates real color clusters, not just the image\'s overall average', () => {
 const px = []
 const push = (r, g, b, a) => px.push(r, g, b, a)
 for (let i = 0; i < 40; i++) push(200, 30, 30, 255) // reds
 for (let i = 0; i < 40; i++) push(30, 30, 200, 255) // blues
 for (let i = 0; i < 10; i++) push(0, 0, 0, 0) // transparent, should not count
 const colors = dominantColors(new Uint8ClampedArray(px), 5)
 assert.ok(colors.length >= 2, 'red and blue should not collapse into one bucket')
 assert.ok(colors.every(isHex))
 const rgbs = colors.map(hexToRgb)
 // a genuinely red cluster and a genuinely blue cluster, not two shades of muddy purple
 assert.ok(rgbs.some(([r, , b]) => r > 150 && b < 80), `no clearly-red color among ${colors}`)
 assert.ok(rgbs.some(([r, , b]) => b > 150 && r < 80), `no clearly-blue color among ${colors}`)
})

test('a grayscale image is bucketed as neutral rather than scattered across hue buckets', () => {
 const px = []
 for (let i = 0; i < 40; i++) px.push(120, 120, 120, 255)
 const colors = dominantColors(new Uint8ClampedArray(px), 5)
 assert.equal(colors.length, 1)
 const [r, g, b] = hexToRgb(colors[0])
 assert.ok(Math.abs(r - 120) < 2 && Math.abs(g - 120) < 2 && Math.abs(b - 120) < 2)
})

test('dominantColors on an empty or fully transparent image returns nothing to work with', () => {
 assert.deepEqual(dominantColors(new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 0]), 5), [])
})

// A fake canvas 2D context and image loader, in the spirit of music.test.js's fake AudioContext: enough
// to exercise extractPalette's real code path without a browser.
function fakeCanvas(pixelMaker) {
 return {
  getContext: () => ({
   drawImage() {},
   getImageData: () => ({ data: pixelMaker() })
  })
 }
}

test('extractPalette samples through the injected canvas and returns real colors', async () => {
 const loadImage = async () => ({ width: 16, height: 16 })
 const createCanvas = () => fakeCanvas(() => {
  const data = []
  for (let i = 0; i < 256; i++) data.push(10, 200, 10, 255)
  return new Uint8ClampedArray(data)
 })
 const colors = await extractPalette('https://example.test/x.jpg', { loadImage, createCanvas })
 assert.ok(colors && colors.length > 0)
})

test('extractPalette resolves to null (never throws) when the image cannot be loaded, times out, or the canvas is tainted', async () => {
 const throwingLoad = async () => { throw new Error('CORS blocked') }
 assert.equal(await extractPalette('x', { loadImage: throwingLoad }), null)

 const hangingLoad = () => new Promise(() => {})
 assert.equal(await extractPalette('x', { loadImage: hangingLoad, timeoutMs: 20 }), null)

 const taintedCanvas = () => ({ getContext: () => ({ drawImage() {}, getImageData() { throw new Error('tainted canvas') } }) })
 assert.equal(await extractPalette('x', { loadImage: async () => ({}), createCanvas: taintedCanvas }), null)
})

test('paletteFromImage samples an already-loaded image directly, with no loader involved', () => {
 const createCanvas = () => fakeCanvas(() => { const d = []; for (let i = 0; i < 64; i++) d.push(20, 200, 20, 255); return new Uint8ClampedArray(d) })
 const colors = paletteFromImage({ width: 8, height: 8 }, { createCanvas })
 assert.ok(colors && colors.length > 0)
})

test('paletteFor uses a pre-loaded image when given one, skipping the network entirely', async () => {
 const piece = { id: '1', title: 'X', creator: 'Y', thumbnail: 'https://example.test/never-fetched.jpg' }
 const createCanvas = () => fakeCanvas(() => { const d = []; for (let i = 0; i < 64; i++) d.push(200, 20, 20, 255); return new Uint8ClampedArray(d) })
 const colors = await paletteFor(piece, { image: { width: 8, height: 8 }, createCanvas })
 assert.ok(colors.length > 0)
})

test('paletteFor prefers a real extraction, and falls back to the piece\'s own words when that fails', async () => {
 const piece = { id: '1', title: 'A Painting', creator: 'Someone', thumbnail: 'https://example.test/t.jpg' }
 const okOpts = { loadImage: async () => ({}), createCanvas: () => fakeCanvas(() => { const d = []; for (let i = 0; i < 64; i++) d.push(100, 50, 200, 255); return new Uint8ClampedArray(d) }) }
 const real = await paletteFor(piece, okOpts)
 assert.ok(real.length > 0)

 const failOpts = { loadImage: async () => { throw new Error('nope') } }
 const fallback = await paletteFor(piece, failOpts)
 assert.deepEqual(fallback, fallbackPalette(`${piece.title}|${piece.creator}`))
})
