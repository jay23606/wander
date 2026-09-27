import test from 'node:test'
import assert from 'node:assert/strict'
import { recordOpen } from '../src/supabase.js'

const piece = { id: 'abc', title: 'A Piece', creator: 'Someone' }

test('resolves to null instead of throwing when the backend is unreachable or not set up', async () => {
 await assert.doesNotReject(async () => {
  assert.equal(await recordOpen(piece, { fetchImpl: async () => { throw new Error('offline') } }), null)
  assert.equal(await recordOpen(piece, { fetchImpl: async () => ({ ok: false, status: 404 }) }), null)
 })
})

test('returns the new total when the backend answers normally', async () => {
 const fetchImpl = async () => ({ ok: true, json: async () => 7 })
 assert.equal(await recordOpen(piece, { fetchImpl }), 7)
})
