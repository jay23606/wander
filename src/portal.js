import { rng, pick, range, int } from './rng.js'

// What a piece "comes alive" into: a small generative scene built only from its own palette and a seed
// (its id, so the same piece always opens into the same scene). No AI call, no model -- shapes drifting
// and pulsing in the piece's own colors is the whole trick, and it is enough to feel alive.

export const SHAPES = ['circle', 'ring', 'triangle', 'square', 'blob']

// Coordinates are normalised (0..1) so the renderer can scale to any canvas size.
export function buildScene(piece, palette, seed = piece.id) {
 const rand = rng(seed)
 const count = int(rand, 14, 26)
 const shapes = []
 for (let i = 0; i < count; i++) {
  const size = range(rand, 0.03, 0.16)
  shapes.push({
   shape: pick(rand, SHAPES),
   x: range(rand, 0.05, 0.95),
   y: range(rand, 0.05, 0.95),
   size,
   color: pick(rand, palette),
   alpha: range(rand, 0.35, 0.9),
   driftX: range(rand, -0.02, 0.02),
   driftY: range(rand, -0.02, 0.02),
   spin: range(rand, -0.6, 0.6),
   phase: range(rand, 0, Math.PI * 2),
   z: rand()
  })
 }
 shapes.sort((a, b) => a.z - b.z)
 return { pieceId: piece.id, palette, background: palette[0], shapes, seed: String(seed) }
}

// Rebuilding a scene for the same piece and palette always gives the identical layout -- it is the
// piece's colors and id driving it, not chance, so a link to "this piece's scene" is meaningful.
export const sceneKey = piece => `piece-${piece.id}`
