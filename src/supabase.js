// A tiny REST wrapper around the shared Supabase project -- see schema.sql. Best-effort: every call
// resolves to null instead of throwing when the project or the schema is not set up, so the gallery
// plays perfectly well on the real image feed alone; this only adds a small shared "opened" counter.

const URL_BASE = 'https://zbtgonklxweikgukzukg.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpidGdvbmtseHdlaWtndWt6dWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NDUwODUsImV4cCI6MjA5OTAyMTA4NX0.xQlEuluDvwrIGgOCU7_AkT2Fc3wq5rMPIfP89-QntaA'

async function rpc(fn, args, { fetchImpl = fetch } = {}) {
 try {
  const res = await fetchImpl(`${URL_BASE}/rest/v1/rpc/${fn}`, {
   method: 'POST',
   headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
   body: JSON.stringify(args)
  })
  if (!res.ok) return null
  return await res.json()
 } catch { return null }
}

// Records that a piece was opened and returns its new community-wide total, or null if the backend is
// not reachable/set up.
export async function recordOpen(piece, opts) {
 return await rpc('wa_record_open', { p_piece_id: piece.id, p_title: piece.title, p_creator: piece.creator }, opts)
}
