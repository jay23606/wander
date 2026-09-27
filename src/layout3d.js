// The corridor's 3D geometry: frames alternate between the left and right wall as you walk down the
// +Z axis. Pure math, no three.js, so it can be tested without a renderer.

export const SPACING = 6 // meters between one frame's position and the next
export const WALL_X = 4 // how far each wall sits from the centre line
export const FRAME_W = 3
export const FRAME_H = 2.2
export const FRAME_Y = 1.7 // the frame's centre height
export const ENTER_RADIUS = 2.4 // how close (in z) counts as "at" a frame
export const CORRIDOR_HALF_W = 3.2 // how far from the centre line the player can walk
export const LOAD_AHEAD = 3 // fetch more once within this many frames of the end
export const EYE_HEIGHT = 1.7

export const positionOf = i => i * SPACING + SPACING / 2
export const sideOf = i => (i % 2 === 0 ? -1 : 1) // -1 = left wall, 1 = right wall

// Where frame i sits and which way it faces (inward, toward the centre line).
export function frameTransform(i) {
 const side = sideOf(i)
 return { x: side * WALL_X, y: FRAME_Y, z: positionOf(i), rotationY: side > 0 ? -Math.PI / 2 : Math.PI / 2, side }
}

export function nearestIndex(z, count) {
 if (!count) return null
 return Math.max(0, Math.min(count - 1, Math.round((z - SPACING / 2) / SPACING)))
}

export const distanceToNearest = (z, count) => {
 const i = nearestIndex(z, count)
 return i == null ? Infinity : Math.abs(z - positionOf(i))
}

export const canEnter = (z, count) => distanceToNearest(z, count) <= ENTER_RADIUS

export const shouldLoadMore = (z, count) => count > 0 && (positionOf(count - 1) - z) <= SPACING * LOAD_AHEAD

export const corridorLength = count => Math.max(SPACING, count * SPACING)

// Keeps the player inside the walls and within the built corridor (with a little room past the last frame).
export function clampToCorridor(x, z, count) {
 return {
  x: Math.max(-CORRIDOR_HALF_W, Math.min(CORRIDOR_HALF_W, x)),
  z: Math.max(0, Math.min(corridorLength(count) + SPACING, z))
 }
}
