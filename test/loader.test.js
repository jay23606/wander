import test from 'node:test'
import assert from 'node:assert/strict'
import { loadWithFallback, placeholderColor } from '../src/loader.js'

test('a successful load resolves ok with the image', async () => {
 const fakeImg = { width: 10, height: 10 }
 const result = await loadWithFallback('https://example.test/x.jpg', { loadImage: async () => fakeImg })
 assert.deepEqual(result, { ok: true, image: fakeImg })
})

test('a rejected load resolves to ok:false instead of throwing', async () => {
 const result = await loadWithFallback('x', { loadImage: async () => { throw new Error('404') } })
 assert.deepEqual(result, { ok: false })
})

test('an image that never responds times out to ok:false rather than hanging forever', async () => {
 const result = await loadWithFallback('x', { loadImage: () => new Promise(() => {}), timeoutMs: 20 })
 assert.deepEqual(result, { ok: false })
})

test('placeholderColor is deterministic for the same text and looks like a valid HSL color', () => {
 const a = placeholderColor('A Piece|Someone')
 const b = placeholderColor('A Piece|Someone')
 const c = placeholderColor('A Different Piece|Someone Else')
 assert.equal(a, b)
 assert.notEqual(a, c)
 assert.match(a, /^hsl\(\d+, 35%, 28%\)$/)
})
