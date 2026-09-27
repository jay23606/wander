import { clampToCorridor } from './layout3d.js'

// First-person movement: a position (x,z; y is a fixed eye height) and a look direction (yaw, pitch).
// yaw 0 faces +Z (the direction the corridor of frames runs); turning right increases yaw. Pure: given
// a state and an input, returns the next state -- no DOM, no three.js, so it is fully testable.

export const SPEED = 3.4 // metres/second
export const TURN_SPEED = 2.2 // radians/second, from the turn keys
export const MAX_PITCH = 1.2 // ~68 degrees either way

export function createWalker(x = 0, z = 0.5) { return { x, z, yaw: 0, pitch: 0 } }

// input: { move, strafe } each -1..1 from keys/buttons, { turn } -1..1 from keys, and
// { yawDelta, pitchDelta } radians already resolved from a drag this frame (0 if none).
export function step(walker, input, dt, count) {
 const yaw = walker.yaw + (input.turn || 0) * TURN_SPEED * dt + (input.yawDelta || 0)
 const pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, walker.pitch + (input.pitchDelta || 0)))
 const move = input.move || 0, strafe = input.strafe || 0
 const dx = (Math.sin(yaw) * move + Math.cos(yaw) * strafe) * SPEED * dt
 const dz = (Math.cos(yaw) * move - Math.sin(yaw) * strafe) * SPEED * dt
 const { x, z } = clampToCorridor(walker.x + dx, walker.z + dz, count)
 return { x, z, yaw, pitch }
}

// The point to look at from the walker's eye, one unit of forward distance away -- what a renderer
// hands straight to camera.lookAt(), so the renderer never has to know our yaw/pitch convention.
export function lookTarget(walker) {
 return {
  x: walker.x + Math.sin(walker.yaw) * Math.cos(walker.pitch),
  y: Math.sin(walker.pitch),
  z: walker.z + Math.cos(walker.yaw) * Math.cos(walker.pitch)
 }
}
