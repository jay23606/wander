# Wander

**[Try it live](https://jay23606.github.io/wander/)**

An endless gallery of real, openly-licensed art and photography. Walk up to any piece and it opens into
a small "living painting" — a generative scene built only from that piece's own colors and a seed, so
the same piece always opens the same way, and no image model is ever called.

Move with **A/D**, the arrow keys, or by dragging. Get close to a piece and press **Enter**/**Space** (or
tap it) to step through. **Back to the gallery** returns you to exactly where you were, ready to keep
walking. The corridor is endless: more real pieces are fetched automatically as you approach the end of
what has loaded so far.

## Why real images instead of an AI model

The original idea was an art gallery where every piece is AI-generated on the fly. That is a real cost
per visitor, forever, for something meant to run free on a static host — the same tradeoff as
[Todayland](https://github.com/jay23606/todayland). Wander takes the same substitution: real, free,
openly-licensed images from [Openverse](https://openverse.org) (no key, no cost, CORS-open) stand in for
generated art, and the "generative" part — the living-painting scene each piece opens into — is a small,
honest procedural system seeded by the piece itself, not a model call.

## How a piece "comes alive"

`src/gallery.js` pulls a fresh page of real CC0/BY/BY-SA images for a rotating search term (35 art- and
photography-flavoured terms, dealt from a shuffle bag so the mix stays varied) straight from Openverse's
API, filtered for size, license and a usable thumbnail. `src/palette.js` samples the piece's own pixels
(a tiny offscreen canvas, bucketed by real hue so red and blue pixels land in different buckets rather
than just re-finding the image's overall average tone) to get its real dominant colors; if a piece's
image cannot be sampled for any reason, a palette is still guessed deterministically from its own title
and creator, so a piece never opens into a blank scene. `src/portal.js` takes that palette and the
piece's own id as a seed and lays out a set of drifting, pulsing shapes — the same piece and palette
always produce the identical scene. `src/render-gallery.js` and `src/render-portal.js` are the two
canvas views; `src/walker.js` and `src/layout.js` are the corridor's movement and geometry.

## Shared state (optional, best-effort)

Wander shares the same Supabase project as the author's other small projects (`schema.sql`,
`wa_`-prefixed). It records, community-wide with no per-person tracking, how many times each piece has
been opened — purely for a small bit of "opened 12 times today" atmosphere next to the credit. Every
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
| `src/layout.js` | the corridor's geometry: frame positions, "close enough to enter", "load more" |
| `src/palette.js` | real pixel sampling (hue-bucketed) with a deterministic word-based fallback |
| `src/portal.js` | a piece's palette + id → a seeded "living painting" scene spec |
| `src/walker.js` | 1-D movement along the corridor |
| `src/render-gallery.js` | draws the corridor and its frames |
| `src/render-portal.js` | draws and animates a scene |
| `src/supabase.js` | best-effort shared "opened" counter |
| `src/main.js` | wiring: input, the game loop, view switching |
| `schema.sql` | the one small `wa_`-prefixed table and function, idempotent |
