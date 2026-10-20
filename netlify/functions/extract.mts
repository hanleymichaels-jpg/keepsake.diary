import { json, serviceClient, requireUser, loadEntry, namesFor, extract } from '../lib/shared.mts'

export const config = { path: '/api/extract' }

/** Body: { id }. Re-derives people, places, keywords and title after she edits the text. */
async function handle(req: Request) {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  const sb = serviceClient()
  const user = await requireUser(req, sb)
  if (!user) return json({ error: 'Not signed in' }, 401)
  const { id } = (await req.json().catch(() => ({}))) as { id?: string }
  if (!id) return json({ error: 'id required' }, 400)

  const entry = await loadEntry(sb, id, user.id)
  if (!entry) return json({ error: 'No such entry' }, 404)
  const text = ((entry.text as string) || '').trim()
  if (!text) return json({ ok: true, skipped: true })

  const chips = await extract(text, await namesFor(sb, user.id))
  const { error } = await sb.from('entries').update({
    people: chips.people, places: chips.places, keywords: chips.keywords, title: chips.title || null,
    updated_at: Date.now(),
  }).eq('id', id).eq('user_id', user.id)
  if (error) return json({ error: error.message }, 500)
  return json({ ok: true, ...chips })
}

export default async (req: Request) => {
  try {
    return await handle(req)
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message.slice(0, 200) : 'Something went wrong' }, 500)
  }
}
