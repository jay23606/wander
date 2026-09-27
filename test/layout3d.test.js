import test from 'node:test'
import assert from 'node:assert/strict'
import { positionOf, sideOf, frameTransform, nearestIndex, canEnter, shouldLoadMore, corridorLength, clampToCorridor, SPACING, WALL_X, ENTER_RADIUS, CORRIDOR_HALF_W } from '../src/layout3d.js'

test('positions are evenly spaced and sides alternate', () => {
 assert.equal(positionOf(1) - positionOf(0), SPACING)
 assert.equal(sideOf(0), -1); assert.equal(sideOf(1), 1); assert.equal(sideOf(2), -1)
})

test('a frame transform sits on its own wall, at the right spot, facing inward', () => {
 const left = frameTransform(0), right = frameTransform(1)
 assert.equal(left.x, -WALL_X); assert.equal(right.x, WALL_X)
 assert.equal(left.z, positionOf(0))
 assert.notEqual(left.rotationY, right.rotationY)
})

test('nearestIndex clamps to the ends and is null for an empty gallery', () => {
 assert.equal(nearestIndex(positionOf(2) + 1, 6), 2)
 assert.equal(nearestIndex(-500, 6), 0)
 assert.equal(nearestIndex(1e9, 6), 5)
 assert.equal(nearestIndex(5, 0), null)
})

test('canEnter is true only within the enter radius of the nearest frame', () => {
 const z = positionOf(3)
 assert.equal(canEnter(z, 6), true)
 assert.equal(canEnter(z + ENTER_RADIUS - 0.1, 6), true)
 assert.equal(canEnter(z + ENTER_RADIUS + 1, 6), false)
})

test('shouldLoadMore triggers only near the far end, never on an empty gallery', () => {
 assert.equal(shouldLoadMore(0, 20), false)
 assert.equal(shouldLoadMore(positionOf(19) - 1, 20), true)
 assert.equal(shouldLoadMore(100, 0), false)
})

test('clampToCorridor keeps the player between the walls and within the built length', () => {
 assert.equal(clampToCorridor(-100, 5, 10).x, -CORRIDOR_HALF_W)
 assert.equal(clampToCorridor(100, 5, 10).x, CORRIDOR_HALF_W)
 assert.equal(clampToCorridor(0, -50, 10).z, 0)
 assert.ok(clampToCorridor(0, 1e6, 10).z <= corridorLength(10) + SPACING)
})
