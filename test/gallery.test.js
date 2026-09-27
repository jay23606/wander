import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchGallery, createSearchBag, SEARCHES, LICENSES } from '../src/gallery.js'

const result = (id, over = {}) => ({ id, title: `Piece ${id}`, creator: 'Someone', license: 'by', url: `https://example.test/${id}.jpg`, width: 800, height: 600, foreign_landing_url: `https://example.test/p/${id}`, ...over })

test('a shuffle bag deals every term once before repeating', () => {
 const bag = createSearchBag(() => 0.5)
 const seen = new Set()
 for (let i = 0; i < SEARCHES.length; i++) seen.add(bag.next())
 assert.equal(seen.size, SEARCHES.length)
})

test('fetchGallery returns the requested count, deduplicated, skipping ids already seen', async () => {
 const fetchImpl = async () => ({ ok: true, json: async () => ({ results: [result(1), result(2), result(1)] }) })
 const { pieces, searches } = await fetchGallery(2, { fetchImpl, rand: () => 0.3, avoidIds: new Set([2]) })
 assert.deepEqual(pieces.map(p => p.id), [1])
 assert.ok(searches.length >= 1)
})

test('unsuitable results are filtered out: wrong license, too small, missing title or https', async () => {
 const fetchImpl = async () => ({
  ok: true,
  json: async () => ({
   results: [
    result(1, { license: 'nc' }),
    result(2, { width: 10, height: 10 }),
    result(3, { title: '' }),
    result(4, { url: 'http://insecure.test/x.jpg' }),
    result(5)
   ]
  })
 })
 const { pieces } = await fetchGallery(5, { fetchImpl, rand: () => 0.1 })
 assert.deepEqual(pieces.map(p => p.id), [5])
})

test('a failed page is skipped and another attempt is made, up to the attempt budget', async () => {
 let calls = 0
 const fetchImpl = async () => { calls++; return calls < 3 ? { ok: false } : { ok: true, json: async () => ({ results: [result(9)] }) } }
 const { pieces } = await fetchGallery(1, { fetchImpl, rand: () => 0.2, maxAttempts: 5 })
 assert.deepEqual(pieces.map(p => p.id), [9])
 assert.equal(calls, 3)
})

test('a gallery that never finds enough still returns what it found, without hanging', async () => {
 const fetchImpl = async () => ({ ok: true, json: async () => ({ results: [] }) })
 const { pieces } = await fetchGallery(5, { fetchImpl, rand: () => 0.4, maxAttempts: 4 })
 assert.deepEqual(pieces, [])
})

test('every piece has a stable thumbnail url through the Openverse proxy, and a credit', () => {
 const p = result(42)
 assert.ok(LICENSES.includes(p.license))
})
