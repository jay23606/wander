import { fetchGallery } from './gallery.js'
import { positions, canEnter, nearestIndex, shouldLoadMore, corridorWidth, SPACING } from './layout.js'
import { step as walkerStep } from './walker.js'
import { createGalleryRenderer } from './render-gallery.js'
import { createPortalRenderer } from './render-portal.js'
import { paletteFor, fallbackPalette } from './palette.js'
import { buildScene } from './portal.js'
import { recordOpen } from './supabase.js'

const $ = s => document.querySelector(s)
const BATCH = 16

async function boot() {
 const state = { pieces: [], walkerX: SPACING / 2, view: 'gallery', input: 0, scenes: new Map(), seen: new Set() }
 const galleryCanvas = $('#gallery'), portalCanvas = $('#portal')
 const galleryRenderer = createGalleryRenderer(galleryCanvas)
 const portalRenderer = createPortalRenderer(portalCanvas)

 async function loadMore() {
  if (state.loading) return
  state.loading = true
  const { pieces } = await fetchGallery(BATCH, { avoidIds: state.seen })
  for (const p of pieces) state.seen.add(p.id)
  state.pieces.push(...pieces)
  state.loading = false
 }
 await loadMore()

 // ---- input ----
 const keys = new Set()
 addEventListener('keydown', e => {
  if (['a', 'd', 'ArrowLeft', 'ArrowRight'].includes(e.key)) keys.add(e.key)
  if ((e.key === 'Enter' || e.key === ' ') && state.view === 'gallery' && canEnter(state.walkerX, state.pieces.length)) {
   e.preventDefault(); enterNearest()
  }
  if (e.key === 'Escape' && state.view === 'portal') leavePortal()
 })
 addEventListener('keyup', e => keys.delete(e.key))
 const updateInput = () => {
  let x = 0
  if (keys.has('a') || keys.has('ArrowLeft')) x -= 1
  if (keys.has('d') || keys.has('ArrowRight')) x += 1
  state.input = x
 }

 let drag = null
 galleryCanvas.addEventListener('pointerdown', e => { drag = { startX: e.clientX, startWalker: state.walkerX }; galleryCanvas.setPointerCapture?.(e.pointerId) })
 galleryCanvas.addEventListener('pointermove', e => { if (drag) { state.walkerX = clampWalker(drag.startWalker - (e.clientX - drag.startX)); } })
 galleryCanvas.addEventListener('pointerup', () => { drag = null })
 galleryCanvas.addEventListener('click', () => { if (canEnter(state.walkerX, state.pieces.length)) enterNearest() })
 $('#back').onclick = leavePortal

 function clampWalker(x) {
  const max = Math.max(SPACING / 2, corridorWidth(state.pieces.length) - SPACING / 2)
  return Math.max(SPACING / 2, Math.min(max, x))
 }

 async function enterNearest() {
  const i = nearestIndex(state.walkerX, state.pieces.length)
  if (i == null) return
  const piece = state.pieces[i]
  state.view = 'portal'
  $('#gallery-view').hidden = true
  $('#portal-view').hidden = false
  $('#p-title').textContent = piece.title
  $('#p-creator').textContent = piece.creator
  $('#p-license').textContent = `CC ${piece.license.toUpperCase()}`
  $('#p-source').href = piece.sourceUrl
  $('#p-opens').hidden = true

  let scene = state.scenes.get(piece.id)
  if (!scene) {
   scene = buildScene(piece, fallbackPalette(`${piece.title}|${piece.creator}`))
   state.scenes.set(piece.id, scene)
   paletteFor(piece).then(real => {
    if (state.view !== 'portal' || state.scenes.get(piece.id) !== scene) return
    const upgraded = buildScene(piece, real, piece.id)
    state.scenes.set(piece.id, upgraded)
   })
  }
  recordOpen(piece).then(total => {
   if (total == null) return
   const el = $('#p-opens')
   el.hidden = false
   el.textContent = `Opened ${total.toLocaleString()} time${total === 1 ? '' : 's'}`
  })
 }

 function leavePortal() {
  state.view = 'gallery'
  $('#gallery-view').hidden = false
  $('#portal-view').hidden = true
 }

 let last = performance.now()
 function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (state.view === 'gallery') {
   updateInput()
   if (!drag) state.walkerX = walkerStep(state.walkerX, state.input, dt, { min: SPACING / 2, max: Math.max(SPACING / 2, corridorWidth(state.pieces.length) - SPACING / 2) })
   if (shouldLoadMore(state.walkerX, state.pieces.length)) loadMore()
   galleryRenderer.draw(state.pieces, state.walkerX, now)
  } else {
   const i = nearestIndex(state.walkerX, state.pieces.length)
   const piece = state.pieces[i]
   const scene = piece && state.scenes.get(piece.id)
   if (scene) portalRenderer.draw(scene, now)
  }
  requestAnimationFrame(frame)
 }
 requestAnimationFrame(frame)

 if (import.meta.env.DEV) {
  window.__wander = {
   state,
   get walkerX() { return state.walkerX }, set walkerX(v) { state.walkerX = v },
   positions: () => positions(state.pieces.length),
   enterNearest, leavePortal, loadMore, fetchGallery
  }
 }
}

boot().catch(err => { console.error(err); $('.sub').textContent = 'Wander could not load. Try refreshing.' })
