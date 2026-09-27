# Wander

**[Try it live](https://jay23606.github.io/wander/)**

A 3D gallery of real, openly-licensed art and photography, texture-mapped onto the walls of an
actual corridor you walk through. Step into any picture and the whole room — walls, floor, fog, light —
tweens to that picture's own colors, so the space itself becomes the picture rather than opening a
separate scene.

**Move:** WASD (or on-screen buttons on touch), drag to look around, arrow keys to turn. Get close to a
picture and press **E**, click it, or tap it to step in; **Leave this picture** returns the room to
neutral. The corridor is endless: more real pieces load automatically as you approach the end of what
has loaded so far. A picture that fails to load never leaves a hole in the wall -- it gets a deterministic
colored placeholder with its own title, and can still be stepped into (using a palette guessed from its
title and creator instead of its pixels).

## Why real images instead of an AI model

The original idea was a gallery where every piece is AI-generated on the fly. That is a real cost per
visitor, forever, for something meant to run free on a static host -- the same tradeoff
[Todayland](https://github.com/jay23606/todayland) made. Wander takes the same substitution: real, free,
openly-licensed images from [Openverse](https://openverse.org) (no key, no cost, CORS-open) are the
actual wall textures, and the "world reacts to the art" part -- the room's aesthetic morphing to match
whatever you just stepped into -- is a small, honest procedural system built from that image's own
sampled colors, not a model call.

## How it works

`src/gallery.js` pulls a fresh page of real CC0/BY/BY-SA images for a rotating search term straight from
Openverse's API. `src/layout3d.js` lays frames alternately along the left and right walls of a straight
corridor. `src/loader.js` loads each frame's image with a timeout, resolving to a clear ok/fail result
instead of ever hanging or throwing, so `src/main.js` can fall back to a deterministic placeholder
(`placeholderColor`, from the piece's own title) when a real image cannot be used as a texture.
`src/palette.js` samples a picture's real pixels (bucketed by actual hue, so red and blue pixels land in
different buckets rather than the whole image just averaging out to one muddy tone) for its dominant
colors, or falls back to the same deterministic guess-from-title/creator scheme if it cannot be sampled
-- either way, a picture always has real, reproducible colors. `src/theme.js` turns a palette into a full
room theme (wall/floor/ceiling/fog/light colors, an ambient level that rises a little for a darker
palette) and tweens smoothly from whatever the room currently looks like to a new one.
`src/walker3d.js` is first-person movement (position + yaw/pitch), independent of three.js, so it is
fully unit tested; `src/main.js` is the three.js scene itself -- geometry, textures, lighting, the render
loop -- which by nature is verified by actually running it rather than by unit tests.

## Shared state (optional, best-effort)

Wander shares the same Supabase project as the author's other small projects (`schema.sql`,
`wa_`-prefixed). It records, community-wide with no per-person tracking, how many times each piece has
been stepped into -- purely for a small bit of "opened 12 times" atmosphere next to the credit. Every
call in `src/supabase.js` resolves to null instead of throwing if the project or schema is not set up;
the gallery is fully playable without it.

## Development

```
npm install
npm run dev      # http://localhost:5173
npm test         # node's own test runner, no dependencies
npm run lint     # eslint
npm run build    # -> dist/
```

Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`; `.github/workflows/ci.yml` runs
lint, tests and a build on every pull request.

## Code layout

| File | What it does |
|---|---|
| `src/rng.js` | a small seeded generator, plus `pick`/`int`/`range` helpers |
| `src/gallery.js` | fetches and curates real pieces from Openverse, avoiding repeats |
| `src/layout3d.js` | the corridor's 3D geometry: frame positions, "close enough to enter", "load more" |
| `src/walker3d.js` | first-person movement: position, yaw, pitch, and the look target |
| `src/loader.js` | a timeout-safe image loader, plus the deterministic placeholder color |
| `src/palette.js` | real pixel sampling (hue-bucketed) with a deterministic word-based fallback |
| `src/theme.js` | a palette → a full room theme, and tweening from one theme to another |
| `src/supabase.js` | best-effort shared "opened" counter |
| `src/main.js` | the three.js scene: geometry, textures, lighting, movement, the render loop |
| `schema.sql` | the one small `wa_`-prefixed table and function, idempotent |
