import test from 'node:test'
import assert from 'node:assert/strict'
import { createWalker, step, lookTarget, SPEED } from '../src/walker3d.js'

test('a fresh walker starts facing yaw 0 with no pitch', () => {
 const w = createWalker(0, 1)
 assert.equal(w.yaw, 0); assert.equal(w.pitch, 0)
})

test('moving forward at yaw 0 increases z (the direction the corridor runs) and leaves x unchanged', () => {
 const w = createWalker(0, 0)
 const after = step(w, { move: 1 }, 1, 20)
 assert.ok(Math.abs(after.x) < 1e-9)
 assert.ok(Math.abs(after.z - SPEED) < 1e-9)
})

test('strafing at yaw 0 moves along x, not z', () => {
 const w = createWalker(0, 5)
 const after = step(w, { strafe: 1 }, 0.5, 20)
 assert.ok(Math.abs(after.x - SPEED * 0.5) < 1e-9)
 assert.ok(Math.abs(after.z - 5) < 1e-9)
})

test('turning changes yaw, and then forward movement follows the new facing', () => {
 const turned = step(createWalker(0, 5), { turn: 1 }, 1, 20)
 assert.ok(turned.yaw > 0)
 const moved = step(turned, { move: 1 }, 1, 20)
 assert.notEqual(moved.x, 0, 'no longer moving straight along z once turned')
})

test('a drag turns yaw and pitch directly by the given delta, and pitch is clamped', () => {
 const w = step(createWalker(), { yawDelta: 0.3, pitchDelta: 0.2 }, 1, 20)
 assert.ok(Math.abs(w.yaw - 0.3) < 1e-9)
 assert.ok(Math.abs(w.pitch - 0.2) < 1e-9)
 const pinned = step(createWalker(), { pitchDelta: 99 }, 1, 20)
 assert.ok(pinned.pitch <= 1.2)
})

test('no input leaves position and facing unchanged', () => {
 const w = createWalker(1, 2)
 const after = step(w, {}, 1, 20)
 assert.equal(after.x, 1); assert.equal(after.z, 2); assert.equal(after.yaw, 0)
})

test('lookTarget is one unit ahead in the walker\'s own facing direction', () => {
 const flat = lookTarget(createWalker(0, 0))
 assert.ok(Math.abs(flat.z - 1) < 1e-9, 'facing +z with no pitch')
 assert.ok(Math.abs(flat.y) < 1e-9)
 const looking = lookTarget({ x: 0, z: 0, yaw: 0, pitch: 0.5 })
 assert.ok(looking.y > 0, 'pitched up looks up')
})
