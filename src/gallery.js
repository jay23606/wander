// Fetches the pieces for the gallery from Openverse's image search (openly-licensed real art and
// photography, no key, CORS-open via Openverse's own thumbnail proxy). No image model is ever called --
// the "generation" happens later, in portal.js, from the colors and words of a real piece.

export const SEARCHES = [
 'impressionist painting', 'abstract art', 'landscape painting', 'watercolor painting', 'surrealism',
 'still life painting', 'portrait painting', 'ink drawing', 'sculpture', 'street art', 'digital art',
 'collage art', 'printmaking', 'pastel drawing', 'charcoal drawing', 'folk art', 'mosaic art',
 'stained glass', 'woodcut print', 'etching art', 'pottery art', 'textile art', 'calligraphy art',
 'oil painting', 'mixed media art', 'botanical illustration', 'architecture photography',
 'nature photography', 'cubism painting', 'expressionist painting', 'ukiyo-e', 'fresco painting',
 'mural art', 'ceramic art', 'wildlife photography', 'astrophotography'
]

export const LICENSES = ['cc0', 'by', 'by-sa']
export const MIN_SIZE = 400 // px, either dimension -- keeps out icons/thumbnails mistagged as photos

const shuffled = (list, rand = Math.random) => {
 const out = [...list]
 for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1));[out[i], out[j]] = [out[j], out[i]] }
 return out
}

// A shuffle bag of search terms, so every term is used once before any repeats, like dealing a deck.
export function createSearchBag(rand = Math.random) {
 let bag = []
 return { next() { if (!bag.length) bag = shuffled(SEARCHES, rand); return bag.pop() } }
}

const suitable = r => r.license && LICENSES.includes(r.license) && r.url?.startsWith('https://') &&
 (!r.width || r.width >= MIN_SIZE) && (!r.height || r.height >= MIN_SIZE) && r.title

const toPiece = r => ({
 id: r.id,
 title: r.title,
 creator: r.creator || 'Unknown artist',
 license: r.license,
 sourceUrl: r.foreign_landing_url || r.url,
 thumbnail: `https://api.openverse.org/v1/images/${r.id}/thumb/`,
 full: r.url
})

// Asks Openverse for one page of a fresh search term. Returns [] on any failure -- the caller decides
// how many attempts to make and what to do if nothing usable turns up.
async function fetchPage(term, page, { fetchImpl = fetch } = {}) {
 try {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(term)}&license=${LICENSES.join(',')}&page_size=20&page=${page}`
  const res = await fetchImpl(url)
  if (!res.ok) return []
  const data = await res.json()
  return (data.results || []).filter(suitable).map(toPiece)
 } catch { return [] }
}

// Gathers `count` pieces, none already in `avoidIds`, none repeated, trying a handful of fresh search
// terms and random pages until enough are found or the attempt budget runs out.
export async function fetchGallery(count, { fetchImpl = fetch, rand = Math.random, avoidIds = new Set(), maxAttempts = 8 } = {}) {
 const bag = createSearchBag(rand)
 const seen = new Set(avoidIds)
 const pieces = []
 const searches = []
 for (let attempt = 0; attempt < maxAttempts && pieces.length < count; attempt++) {
  const term = bag.next()
  const page = 1 + Math.floor(rand() * 8)
  searches.push(term)
  const found = await fetchPage(term, page, { fetchImpl })
  for (const p of found) {
   if (seen.has(p.id)) continue
   seen.add(p.id); pieces.push(p)
   if (pieces.length >= count) break
  }
 }
 return { pieces: pieces.slice(0, count), searches }
}
