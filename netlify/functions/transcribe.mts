import { json, serviceClient, requireUser, loadEntry, namesFor, transcribe, extract } from '../lib/shared.mts'

export const config = { path: '/api/transcribe' }

/** Body: { id }. Downloads the recording, writes the transcript and the derived chips back onto the entry. */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  const sb = serviceClient()
  const user = await requireUser(req, sb)
  if (!user) return json({ error: 'Not signed in' }, 401)
  const { id } = (await req.json().catch(() => ({}))) as { id?: string }
  if (!id) return json({ error: 'id required' }, 400)

  const entry = await loadEntry(sb, id, user.id)
  if (!entry) return json({ error: 'No such entry' }, 404)
  const audio = entry.audio as { id: string } | null
  if (!audio) return json({ error: 'Entry has no recording' }, 400)
  if (entry.transcript) return json({ ok: true, already: true })

  const { data: blob, error } = await sb.storage.from('media').download(`${user.id}/${audio.id}`)
  if (error || !blob) return json({ error: 'Recording not uploaded yet' }, 409)

  const names = await namesFor(sb, user.id)
  const transcript = await transcribe(blob, names)
  const text = ((entry.text as string) || '').trim() || transcript
  const chips = text ? await extract(text, names) : { people: [], places: [], keywords: [], title: '' }

  const { error: upErr } = await sb.from('entries').update({
    transcript, text, transcribing: false,
    people: chips.people, places: chips.places, keywords: chips.keywords, title: chips.title || null,
    updated_at: Date.now(),
  }).eq('id', id).eq('user_id', user.id)
  if (upErr) return json({ error: upErr.message }, 500)
  return json({ ok: true, transcript })
}
