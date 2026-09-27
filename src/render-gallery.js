import { positionOf, canEnter, nearestIndex } from './layout.js'

// Draws the corridor: a floor/wall strip, a frame for each piece with its thumbnail once loaded, and
// the walker. The camera follows the walker so the corridor scrolls rather than the player.

const FRAME_W = 220
const FRAME_H = 160

export function createGalleryRenderer(canvas) {
 const ctx = canvas.getContext('2d')
 const images = new Map() // piece.id -> HTMLImageElement | 'error'

 function ensureImage(piece) {
  if (images.has(piece.id)) return images.get(piece.id)
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => images.set(piece.id, img)
  img.onerror = () => images.set(piece.id, 'error')
  img.src = piece.thumbnail
  images.set(piece.id, 'loading')
  return 'loading'
 }

 function resize() {
  canvas.width = canvas.clientWidth || 800
  canvas.height = canvas.clientHeight || 420
 }
 resize()
 addEventListener('resize', resize)

 return {
  draw(pieces, walkerX, t) {
   const w = canvas.width, h = canvas.height
   ctx.clearRect(0, 0, w, h)
   const grad = ctx.createLinearGradient(0, 0, 0, h)
   grad.addColorStop(0, '#171a22'); grad.addColorStop(1, '#0a0c12')
   ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
   ctx.fillStyle = '#050608'
   ctx.fillRect(0, h * 0.72, w, h * 0.28)

   const camX = walkerX - w / 2
   const near = nearestIndex(walkerX, pieces.length)

   pieces.forEach((piece, i) => {
    const cx = positionOf(i) - camX
    if (cx < -FRAME_W || cx > w + FRAME_W) return
    const cy = h * 0.38
    const active = i === near && canEnter(walkerX, pieces.length)
    ctx.save()
    ctx.translate(cx, cy + Math.sin(t / 900 + i) * (active ? 4 : 1.5))
    // frame
    ctx.fillStyle = active ? '#2a2f3f' : '#1c1f29'
    ctx.strokeStyle = active ? '#8ed0ad' : '#3a3f4e'
    ctx.lineWidth = active ? 4 : 2
    ctx.beginPath(); roundRect(ctx, -FRAME_W / 2 - 10, -FRAME_H / 2 - 10, FRAME_W + 20, FRAME_H + 20, 8)
    ctx.fill(); ctx.stroke()
    const img = ensureImage(piece)
    if (img && img !== 'loading' && img !== 'error') {
     ctx.save(); ctx.beginPath(); roundRect(ctx, -FRAME_W / 2, -FRAME_H / 2, FRAME_W, FRAME_H, 3); ctx.clip()
     drawCover(ctx, img, -FRAME_W / 2, -FRAME_H / 2, FRAME_W, FRAME_H)
     ctx.restore()
    } else {
     ctx.fillStyle = '#11141b'
     ctx.fillRect(-FRAME_W / 2, -FRAME_H / 2, FRAME_W, FRAME_H)
     ctx.fillStyle = img === 'error' ? '#7c6f6f' : '#5a6270'
     ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
     ctx.fillText(img === 'error' ? 'Could not load' : 'Loading…', 0, 0)
    }
    if (active) {
     ctx.fillStyle = '#8ed0ad'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'
     ctx.fillText('walk closer to step through', 0, FRAME_H / 2 + 30)
    }
    ctx.restore()
   })

   // the walker, always centred
   ctx.save()
   ctx.translate(w / 2, h * 0.62)
   ctx.font = '34px "Segoe UI Emoji","Noto Color Emoji",sans-serif'
   ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
   ctx.fillText('🚶', 0, Math.sin(t / 260) * 3)
   ctx.restore()
  }
 }
}

function roundRect(ctx, x, y, w, h, r) {
 ctx.moveTo(x + r, y)
 ctx.arcTo(x + w, y, x + w, y + h, r)
 ctx.arcTo(x + w, y + h, x, y + h, r)
 ctx.arcTo(x, y + h, x, y, r)
 ctx.arcTo(x, y, x + w, y, r)
 ctx.closePath()
}

function drawCover(ctx, img, x, y, w, h) {
 const ir = img.width / img.height, r = w / h
 let sw = img.width, sh = img.height, sx = 0, sy = 0
 if (ir > r) { sw = img.height * r; sx = (img.width - sw) / 2 } else { sh = img.width / r; sy = (img.height - sh) / 2 }
 ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}
