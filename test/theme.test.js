import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTheme, tweenTheme, lerpColor, shade, luminance, DEFAULT_THEME } from '../src/theme.js'

const isHex = c => /^#[0-9a-f]{6}$/.test(c)

test('an empty or missing palette falls back to the default theme', () => {
 assert.deepEqual(buildTheme([]), DEFAULT_THEME)
 assert.deepEqual(buildTheme(null), DEFAULT_THEME)
})

test('a theme takes its wall color from the palette, with a genuinely darker floor and ceiling', () => {
 const palette = ['#a05030', '#302050', '#50a030', '#ffffff', '#101010']
 const theme = buildTheme(palette)
 assert.equal(theme.wall, palette[0])
 assert.ok([theme.wall, theme.floor, theme.ceiling, theme.fog, theme.light].every(isHex))
 assert.ok(luminance(theme.floor) < luminance(theme.wall))
 assert.ok(luminance(theme.ceiling) < luminance(theme.wall))
})

test('the light color is the palette\'s own brightest entry', () => {
 const palette = ['#202020', '#ffffff', '#404040']
 assert.equal(buildTheme(palette).light, '#ffffff')
})

test('a dark palette gets more ambient light than a bright one, both within a sane range', () => {
 const dark = buildTheme(['#0a0a0a', '#151515', '#050505'])
 const bright = buildTheme(['#f0f0f0', '#e8e8e8', '#ffffff'])
 assert.ok(dark.ambient > bright.ambient)
 for (const t of [dark, bright]) assert.ok(t.ambient >= 0.35 && t.ambient <= 0.9)
})

test('lerpColor and shade move colors the right direction and clamp at the ends', () => {
 assert.equal(lerpColor('#000000', '#ffffff', 0), '#000000')
 assert.equal(lerpColor('#000000', '#ffffff', 1), '#ffffff')
 assert.equal(lerpColor('#000000', '#ffffff', 0.5), '#808080')
 assert.equal(shade('#ffffff', 50), '#ffffff', 'clamped, cannot go above white')
 assert.equal(shade('#000000', -50), '#000000', 'clamped, cannot go below black')
})

test('tweenTheme at t=0 is the current theme, at t=1 is the target, matching field for field', () => {
 const a = buildTheme(['#100000', '#200000', '#300000'])
 const b = buildTheme(['#000010', '#000020', '#000030'])
 assert.deepEqual(tweenTheme(a, b, 0), a)
 assert.deepEqual(tweenTheme(a, b, 1), b)
 const mid = tweenTheme(a, b, 0.5)
 assert.ok(mid.ambient > Math.min(a.ambient, b.ambient) - 1e-9 && mid.ambient < Math.max(a.ambient, b.ambient) + 1e-9)
})
