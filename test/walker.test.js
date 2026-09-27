import test from 'node:test'
import assert from 'node:assert/strict'
import { step, SPEED } from '../src/walker.js'

test('stepping moves at the given speed in the given direction', () => {
 assert.equal(step(1000, 1, 1, { min: 0, max: 10000 }), 1000 + SPEED)
 assert.equal(step(1000, -1, 1, { min: 0, max: 10000 }), 1000 - SPEED)
})

test('no input leaves x unchanged', () => {
 assert.equal(step(250, 0, 1, { min: 0, max: 10000 }), 250)
})

test('x is clamped to the given bounds either direction', () => {
 assert.equal(step(5, -1, 1, { min: 0, max: 10000 }), 0)
 assert.equal(step(9990, 1, 1, { min: 0, max: 10000 }), 10000)
})
