import * as THREE from 'three'
import { fetchGallery } from './gallery.js'
import { frameTransform, nearestIndex, canEnter, shouldLoadMore, WALL_X, FRAME_W, FRAME_H, CORRIDOR_HALF_W, EYE_HEIGHT } from './layout3d.js'
import { createWalker, step as walkerStep, lookTarget } from './walker3d.js'
import { paletteFor } from './palette.js'
import { buildTheme, tweenTheme, DEFAULT_THEME } from './theme.js'
import { loadWithFallback, placeholderColor } from './loader.js'
import { recordOpen } from './supabase.js'

const $ = s => document.querySelector(s)
const BATCH = 14
const CORRIDOR_LEN = 2000

async function boot() {
 const state = {
  pieces: [], walker: createWalker(0, 0.5), seen: new Set(),
  theme: { ...DEFAULT_THEME }, targetTheme: { ...DEFAULT_THEME }, tween: 1,
  entered: null, loading: false
 }

 // ---- three.js scene ----
 const canvas = $('#scene')
 const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
 renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
 const scene = new THREE.Scene()
 scene.fog = new THREE.Fog(new THREE.Color(state.theme.fog).getHex(), 4, 32)
 const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 200)

 const ambient = new THREE.AmbientLight(new THREE.Color(state.theme.light).getHex(), state.theme.ambient)
 scene.add(ambient)
 const keyLight = new THREE.DirectionalLight(new THREE.Color(state.theme.light).getHex(), 0.6)
 keyLight.position.set(2, 6, -3)
 scene.add(keyLight)

 const floorGeo = new THREE.PlaneGeometry(CORRIDOR_HALF_W * 2, CORRIDOR_LEN)
 const floorMat = new THREE.MeshStandardMaterial({ color: state.theme.floor, roughness: 0.9 })
 const floor = new THREE.Mesh(floorGeo, floorMat)
 floor.rotation.x = -Math.PI / 2
 floor.position.set(0, 0, CORRIDOR_LEN / 2)
 scene.add(floor)

 const ceilingMat = new THREE.MeshStandardMaterial({ color: state.theme.ceiling, roughness: 1 })
 const ceiling = new THREE.Mesh(floorGeo, ceilingMat)
 ceiling.rotation.x = Math.PI / 2
 ceiling.position.set(0, 4.2, CORRIDOR_LEN / 2)
 scene.add(ceiling)

 const wallGeo = new THREE.PlaneGeometry(CORRIDOR_LEN, 4.2)
 const wallMat = new THREE.MeshStandardMaterial({ color: state.theme.wall, roughness: 0.85, side: THREE.FrontSide })
 const wallL = new THREE.Mesh(wallGeo, wallMat)
 wallL.position.set(-WALL_X, 2.1, CORRIDOR_LEN / 2); wallL.rotation.y = Math.PI / 2
 scene.add(wallL)
 const wallR = new THREE.Mesh(wallGeo, wallMat.clone())
 wallR.position.set(WALL_X, 2.1, CORRIDOR_LEN / 2); wallR.rotation.y = -Math.PI / 2
 scene.add(wallR)

 const frameGroup = new THREE.Group()
 scene.add(frameGroup)
 const frameMeshes = [] // { mesh, mat, piece }

 function resize() {
  const w = canvas.clientWidth || 800, h = canvas.clientHeight || 450
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
 }
 resize()
 addEventListener('resize', resize)

 function placeholderMaterial(piece) {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 190
  const ctx = c.getContext('2d')
  ctx.fillStyle = placeholderColor(`${piece.title}|${piece.creator}`)
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.fillStyle = 'rgba(255,255,255,.85)'
  ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  wrapText(ctx, piece.title, c.width / 2, c.height / 2, c.width - 24, 20)
  const tex = new THREE.CanvasTexture(c)
  return new THREE.MeshStandardMaterial({ map: tex })
 }

 function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
   const test = line ? `${line} ${w}` : w
   if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w } else line = test
  }
  lines.push(line)
  const startY = y - ((lines.length - 1) * lineHeight) / 2
  lines.slice(0, 4).forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight))
 }

 async function addFrame(piece, index) {
  const t = frameTransform(index)
  const geo = new THREE.PlaneGeometry(FRAME_W, FRAME_H)
  const mat = placeholderMaterial(piece)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(t.x, t.y, t.z)
  mesh.rotation.y = t.rotationY
  frameGroup.add(mesh)
  const entry = { mesh, mat, piece, image: null, ready: false }
  frameMeshes.push(entry)

  const { ok, image } = await loadWithFallback(piece.thumbnail)
  if (ok) {
   const tex = new THREE.Texture(image)
   tex.needsUpdate = true
   tex.colorSpace = THREE.SRGBColorSpace
   mesh.material.map = tex
   mesh.material.color.set('#ffffff')
   mesh.material.needsUpdate = true
   entry.image = image
   entry.ready = true
  }
 }

 async function loadMore() {
  if (state.loading) return
  state.loading = true
  const start = state.pieces.length
  const { pieces } = await fetchGallery(BATCH, { avoidIds: state.seen })
  for (const p of pieces) state.seen.add(p.id)
  state.pieces.push(...pieces)
  pieces.forEach((p, i) => addFrame(p, start + i))
  state.loading = false
 }
 await loadMore()

 // ---- input: keys + drag-to-look (no pointer lock, so it works the same on touch) ----
 const keys = new Set()
 addEventListener('keydown', e => {
  if (['w', 'a', 's', 'd', 'ArrowLeft', 'ArrowRight', 'e', 'E', ' '].includes(e.key)) keys.add(e.key.toLowerCase())
  if ((e.key === 'e' || e.key === 'E' || e.key === ' ') && canEnter(state.walker.z, state.pieces.length)) { e.preventDefault(); enterNearest() }
 })
 addEventListener('keyup', e => keys.delete(e.key.toLowerCase()))

 let drag = null
 canvas.addEventListener('pointerdown', e => { drag = { lastX: e.clientX, lastY: e.clientY }; canvas.setPointerCapture?.(e.pointerId) })
 canvas.addEventListener('pointermove', e => {
  if (!drag) return
  state.lookDelta = { yaw: (e.clientX - drag.lastX) * -0.0035, pitch: (e.clientY - drag.lastY) * -0.0035 }
  drag.lastX = e.clientX; drag.lastY = e.clientY
 })
 const endDrag = () => { drag = null }
 canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag)
 canvas.addEventListener('click', () => { if (!drag && canEnter(state.walker.z, state.pieces.length)) enterNearest() })

 $('#enter-btn').onclick = () => enterNearest()
 $('#back-btn').onclick = () => leaveTheme()

 // touch: on-screen buttons mirror the keys, held while pressed, so mobile can walk without a keyboard
 const touch = { move: 0, strafe: 0 }
 const holdButton = (id, apply, release) => {
  const el = $(id); if (!el) return
  const on = e => { e.preventDefault(); apply() }
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', release); el.addEventListener('pointerleave', release); el.addEventListener('pointercancel', release)
 }
 holdButton('#btn-forward', () => { touch.move = 1 }, () => { if (touch.move > 0) touch.move = 0 })
 holdButton('#btn-back', () => { touch.move = -1 }, () => { if (touch.move < 0) touch.move = 0 })
 holdButton('#btn-strafe-l', () => { touch.strafe = -1 }, () => { if (touch.strafe < 0) touch.strafe = 0 })
 holdButton('#btn-strafe-r', () => { touch.strafe = 1 }, () => { if (touch.strafe > 0) touch.strafe = 0 })

 if (matchMedia('(pointer: coarse)').matches) $('#hint').innerHTML = '<b>Drag</b> to look and to move · buttons to walk · tap a picture to step into it'

 function currentInput() {
  const input = { move: touch.move, strafe: touch.strafe, turn: 0 }
  if (keys.has('w')) input.move += 1
  if (keys.has('s')) input.move -= 1
  if (keys.has('d')) input.strafe += 1
  if (keys.has('a')) input.strafe -= 1
  if (keys.has('arrowright')) input.turn += 1
  if (keys.has('arrowleft')) input.turn -= 1
  if (state.lookDelta) { input.yawDelta = state.lookDelta.yaw; input.pitchDelta = state.lookDelta.pitch; state.lookDelta = null }
  return input
 }

 async function enterNearest() {
  const i = nearestIndex(state.walker.z, state.pieces.length)
  if (i == null) return
  const entry = frameMeshes[i]
  if (!entry) return
  state.entered = entry.piece
  $('#credit').hidden = false
  $('#p-title').textContent = entry.piece.title
  $('#p-creator').textContent = entry.piece.creator
  $('#p-license').textContent = `CC ${entry.piece.license.toUpperCase()}`
  $('#p-source').href = entry.piece.sourceUrl
  $('#p-opens').hidden = true

  const palette = await paletteFor(entry.piece, entry.ready ? { image: entry.image } : {})
  state.targetTheme = buildTheme(palette)
  state.tween = 0

  recordOpen(entry.piece).then(total => {
   if (total == null) return
   const el = $('#p-opens')
   el.hidden = false
   el.textContent = `Opened ${total.toLocaleString()} time${total === 1 ? '' : 's'}`
  })
 }

 function leaveTheme() {
  state.entered = null
  $('#credit').hidden = true
  state.targetTheme = DEFAULT_THEME
  state.tween = 0
 }

 function applyTheme(theme) {
  wallMat.color.set(theme.wall); wallR.material.color.set(theme.wall)
  floorMat.color.set(theme.floor)
  ceilingMat.color.set(theme.ceiling)
  scene.fog.color.set(theme.fog)
  ambient.color.set(theme.light); ambient.intensity = theme.ambient
  keyLight.color.set(theme.light)
 }

 let last = performance.now()
 function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now

  const input = currentInput()
  state.walker = walkerStep(state.walker, input, dt, state.pieces.length)

  if (shouldLoadMore(state.walker.z, state.pieces.length)) loadMore()

  if (state.tween < 1) {
   state.tween = Math.min(1, state.tween + dt / 1.4)
   state.theme = tweenTheme(state.theme, state.targetTheme, state.tween === 1 ? 1 : 1 - Math.pow(1 - state.tween, 3))
   applyTheme(state.theme)
  }

  camera.position.set(state.walker.x, EYE_HEIGHT, state.walker.z)
  const look = lookTarget(state.walker)
  camera.lookAt(state.walker.x + (look.x - state.walker.x), EYE_HEIGHT + look.y, state.walker.z + (look.z - state.walker.z))

  $('#prompt').hidden = !canEnter(state.walker.z, state.pieces.length) || Boolean(state.entered)
  document.querySelector('.touch-controls').style.visibility = state.entered ? 'hidden' : 'visible'
  $('#hint-count').textContent = `${state.pieces.length} pieces so far`

  renderer.render(scene, camera)
  requestAnimationFrame(frame)
 }
 requestAnimationFrame(frame)

 if (import.meta.env.DEV) {
  window.__wander = {
   state, scene, camera,
   get walker() { return state.walker }, set walker(w) { state.walker = w },
   enterNearest, leaveTheme, loadMore, frameMeshes, fetchGallery, addFrame
  }
 }
}

boot().catch(err => { console.error(err); $('.sub').textContent = 'Wander could not load. Try refreshing.' })
