// Draws a built scene (portal.js) animating: shapes drift, pulse, and slowly spin in the piece's own
// colors. Nothing here decides what to draw, only how -- the scene spec is the single source of truth.

export function createPortalRenderer(canvas) {
 const ctx = canvas.getContext('2d')

 function resize() {
  canvas.width = canvas.clientWidth || 800
  canvas.height = canvas.clientHeight || 480
 }
 resize()
 addEventListener('resize', resize)

 function drawShape(s, x, y, r, t) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(t * s.spin * 0.001 + s.phase)
  ctx.globalAlpha = s.alpha * (0.75 + 0.25 * Math.sin(t / 700 + s.phase))
  ctx.fillStyle = s.color
  if (s.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill() }
  else if (s.shape === 'ring') { ctx.strokeStyle = s.color; ctx.lineWidth = r * 0.3; ctx.beginPath(); ctx.arc(0, 0, r * 0.75, 0, 7); ctx.stroke() }
  else if (s.shape === 'square') { ctx.fillRect(-r, -r, r * 2, r * 2) }
  else if (s.shape === 'triangle') {
   ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.87, r * 0.5); ctx.lineTo(-r * 0.87, r * 0.5); ctx.closePath(); ctx.fill()
  } else {
   ctx.beginPath()
   for (let a = 0; a < 7; a++) {
    const rr = r * (0.75 + 0.25 * Math.sin(a * 2.4 + s.phase))
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr
    a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
   }
   ctx.closePath(); ctx.fill()
  }
  ctx.restore()
 }

 return {
  draw(scene, t) {
   const w = canvas.width, h = canvas.height, side = Math.min(w, h)
   ctx.clearRect(0, 0, w, h)
   const grad = ctx.createRadialGradient(w / 2, h / 2, side * 0.05, w / 2, h / 2, side * 0.75)
   grad.addColorStop(0, scene.background); grad.addColorStop(1, shade(scene.background, -40))
   ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
   for (const s of scene.shapes) {
    const x = w * ((s.x + Math.sin(t / 4000 + s.phase) * s.driftX) % 1)
    const y = h * ((s.y + Math.cos(t / 4000 + s.phase) * s.driftY) % 1)
    drawShape(s, wrap(x, w), wrap(y, h), s.size * side, t)
   }
  }
 }
}

const wrap = (v, max) => ((v % max) + max) % max
function shade(hex, amt) {
 const n = parseInt(hex.slice(1), 16)
 const r = Math.max(0, Math.min(255, (n >> 16) + amt))
 const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt))
 const b = Math.max(0, Math.min(255, (n & 0xff) + amt))
 return `rgb(${r},${g},${b})`
}
