import test from 'node:test'
import assert from 'node:assert/strict'
import { buildScene, SHAPES, sceneKey } from '../src/portal.js'
import { fallbackPalette } from '../src/palette.js'

const piece = { id: 'abc-123', title: 'Test Piece', creator: 'Test Artist' }
const palette = fallbackPalette('Test Piece|Test Artist')

test('the same piece and palette always build the identical scene', () => {
 const a = buildScene(piece, palette)
 const b = buildScene(piece, palette)
 assert.deepEqual(a, b)
})

test('a different piece id builds a different scene from the same palette', () => {
 const a = buildScene(piece, palette)
 const b = buildScene({ ...piece, id: 'xyz-999' }, palette)
 assert.notDeepEqual(a.shapes, b.shapes)
})

test('every shape is a known kind, fully in bounds, uses a color from the palette, and has visible alpha', () => {
 const scene = buildScene(piece, palette)
 assert.ok(scene.shapes.length >= 14 && scene.shapes.length <= 26)
 for (const s of scene.shapes) {
  assert.ok(SHAPES.includes(s.shape))
  assert.ok(s.x >= 0 && s.x <= 1 && s.y >= 0 && s.y <= 1)
  assert.ok(s.size > 0 && s.size < 0.2)
  assert.ok(palette.includes(s.color))
  assert.ok(s.alpha > 0 && s.alpha <= 1)
 }
})

test('shapes are depth-sorted so the scene draws back-to-front consistently', () => {
 const scene = buildScene(piece, palette)
 for (let i = 1; i < scene.shapes.length; i++) assert.ok(scene.shapes[i].z >= scene.shapes[i - 1].z)
})

test('the background is the palette\'s own first color, and sceneKey identifies the piece', () => {
 const scene = buildScene(piece, palette)
 assert.equal(scene.background, palette[0])
 assert.equal(sceneKey(piece), `piece-${piece.id}`)
})
