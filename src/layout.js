// The gallery is one long corridor: pieces hang at evenly spaced points along a single axis, and the
// player walks left/right along it. Pure geometry, so it can be tested without a canvas.

export const SPACING = 340 // px between the centre of one frame and the next
export const ENTER_RADIUS = 90 // how close the player has to be to "enter" a piece
export const LOAD_AHEAD = 3 // fetch more once the player is within this many frames of the end

export const positionOf = i => i * SPACING + SPACING / 2
export const positions = count => Array.from({ length: count }, (_, i) => positionOf(i))

// The index of the piece closest to x, or null if there are none.
export function nearestIndex(x, count) {
 if (!count) return null
 const i = Math.max(0, Math.min(count - 1, Math.round((x - SPACING / 2) / SPACING)))
 return i
}

export const distanceToNearest = (x, count) => {
 const i = nearestIndex(x, count)
 return i == null ? Infinity : Math.abs(x - positionOf(i))
}

export const canEnter = (x, count) => distanceToNearest(x, count) <= ENTER_RADIUS

// True once the player is close enough to the far end that more pieces should be fetched.
export const shouldLoadMore = (x, count) => count > 0 && (positionOf(count - 1) - x) <= SPACING * LOAD_AHEAD

export const corridorWidth = count => Math.max(SPACING, count * SPACING)
