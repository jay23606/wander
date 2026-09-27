// Turns a piece's palette into the room's own look: wall, floor and ceiling colors, fog, and a light
// color -- everything the 3D corridor is tinted with once you have stepped into that piece. Pure color
// math, so it can be tested without a renderer; render/main.js does the actual tweening each frame.

export const DEFAULT_THEME = {
 wall: '#23262f', floor: '#15171c', ceiling: '#1a1c22', fog: '#0c0d11', light: '#cfd6e6', ambient: 0.55
}

export const hexToRgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
const toHex = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
export const rgbToHex = (r, g, b) => `#${toHex(r)}${toHex(g)}${toHex(b)}`

export const shade = (hex, amt) => {
 const [r, g, b] = hexToRgb(hex)
 return rgbToHex(r + amt, g + amt, b + amt)
}

export const luminance = hex => {
 const [r, g, b] = hexToRgb(hex)
 return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export const lerpColor = (a, b, t) => {
 const [ar, ag, ab] = hexToRgb(a), [br, bg, bb] = hexToRgb(b)
 return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t)
}

const brightestOf = palette => [...palette].sort((a, b) => luminance(b) - luminance(a))[0]

// A palette (5-ish hex colors, darkest-to-brightest in no particular order) becomes a full room theme.
// The wall takes the palette's own dominant color; the floor and ceiling are darker versions of it, so
// the room reads as one lit space rather than a wall of raw color; the light is the palette's brightest
// entry, and a darker overall palette gets a touch more ambient light so the room is never unreadable.
export function buildTheme(palette) {
 if (!palette || !palette.length) return DEFAULT_THEME
 const wall = palette[0]
 const floor = shade(wall, -70)
 const ceiling = shade(wall, -50)
 const light = brightestOf(palette)
 const avgLum = palette.reduce((s, c) => s + luminance(c), 0) / palette.length
 const ambient = Math.max(0.35, Math.min(0.9, 0.75 - avgLum * 0.35))
 return { wall, floor, ceiling, fog: shade(wall, -60), light, ambient }
}

// One step of tweening the current theme toward a target -- every field is a lerp except ambient,
// which is a plain numeric lerp.
export function tweenTheme(current, target, t) {
 return {
  wall: lerpColor(current.wall, target.wall, t),
  floor: lerpColor(current.floor, target.floor, t),
  ceiling: lerpColor(current.ceiling, target.ceiling, t),
  fog: lerpColor(current.fog, target.fog, t),
  light: lerpColor(current.light, target.light, t),
  ambient: current.ambient + (target.ambient - current.ambient) * t
 }
}
