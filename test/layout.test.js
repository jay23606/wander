import test from 'node:test'
import assert from 'node:assert/strict'
import { positions, positionOf, nearestIndex, distanceToNearest, canEnter, shouldLoadMore, SPACING, ENTER_RADIUS, corridorWidth } from '../src/layout.js'

test('positions are evenly spaced, centred in their own slot', () => {
 const ps = positions(4)
 assert.equal(ps.length, 4)
 for (let i = 0; i < ps.length; i++) assert.equal(ps[i], positionOf(i))
 for (let i = 1; i < ps.length; i++) assert.equal(ps[i] - ps[i - 1], SPACING)
})

test('nearestIndex finds the closest frame and clamps to the ends', () => {
 assert.equal(nearestIndex(positionOf(2) + 5, 6), 2)
 assert.equal(nearestIndex(-500, 6), 0)
 assert.equal(nearestIndex(1e9, 6), 5)
 assert.equal(nearestIndex(0, 0), null)
})

test('canEnter is true only within the enter radius of the nearest frame', () => {
 const x = positionOf(3)
 assert.equal(canEnter(x, 6), true)
 assert.equal(canEnter(x + ENTER_RADIUS - 1, 6), true)
 assert.equal(canEnter(x + ENTER_RADIUS + 40, 6), false)
 assert.equal(distanceToNearest(x, 6), 0)
})

test('shouldLoadMore triggers only near the far end, and never on an empty gallery', () => {
 assert.equal(shouldLoadMore(0, 20), false)
 assert.equal(shouldLoadMore(positionOf(19) - 10, 20), true)
 assert.equal(shouldLoadMore(100, 0), false)
})

test('corridorWidth grows with the count and is never smaller than one spacing', () => {
 assert.equal(corridorWidth(0), SPACING)
 assert.ok(corridorWidth(10) > corridorWidth(5))
})
