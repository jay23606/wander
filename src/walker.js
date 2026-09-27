// Movement along the corridor: one axis, continuous, clamped to the pieces actually loaded so far.
export const SPEED = 480 // px/s

export function step(x, input, dt, bounds) {
 const next = x + input * SPEED * dt
 return Math.max(bounds.min, Math.min(bounds.max, next))
}
