import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function env(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing environment variable ${name}`)
  return v
}

/** Service-role client: bypasses row security, so every query below filters by user id explicitly. */
export function serviceClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Who is calling? The app sends her session token as a Bearer header. */
export async function requireUser(req: Request, sb: SupabaseClient) {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

export async function loadEntry(sb: SupabaseClient, id: string, userId: string) {
  const { data, error } = await sb.from('entries').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data as Record<string, unknown> | null
}

export async function namesFor(sb: SupabaseClient, userId: string): Promise<string[]> {
  const { data } = await sb.from('settings').select('names').eq('user_id', userId).maybeSingle()
  return ((data?.names as string | undefined) ?? '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
}

const extensionFor: Record<string, string> = {
  'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/mpeg': 'mp3',
  'audio/webm': 'webm', 'audio/wav': 'wav', 'audio/ogg': 'ogg',
}

/** Speech to text. The names list is passed as a vocabulary hint so her people are spelled right. */
export async function transcribe(audio: Blob, names: string[]): Promise<string> {
  const base = (audio.type || 'audio/mp4').split(';')[0]
  const ext = extensionFor[base] ?? 'm4a'
  const form = new FormData()
  form.append('file', audio, `memory.${ext}`)
  form.append('model', process.env.TRANSCRIBE_MODEL ?? 'gpt-4o-transcribe')
  form.append('language', 'en')
  form.append('response_format', 'json')
  if (names.length) form.append('prompt', `A personal diary entry. People who may be mentioned: ${names.join(', ')}.`)
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { authorization: `Bearer ${env('OPENAI_API_KEY')}` },
    body: form,
  })
  if (!res.ok) throw new Error(`Transcription failed: ${res.status} ${(await res.text()).slice(0, 200)}`)
  const out = (await res.json()) as { text?: string }
  return (out.text ?? '').trim()
}

const Extraction = z.object({
  people: z.array(z.string()).describe('First names or how she refers to them, spelled as in the names list when they match'),
  places: z.array(z.string()).describe('Short place phrases exactly as she said them, e.g. "the lake", "Café Rosa"'),
  keywords: z.array(z.string()).describe('Three to eight plain lowercase words that would help find this later'),
  title: z.string().describe('At most five words, no full stop'),
})
export type Extraction = z.infer<typeof Extraction>

const SYSTEM = `You read one short entry from one person's private diary and pull out what would help her find it again later.
Return only what is in the text. Never invent people or places. "Mum", "Dad", "the boys" count as people.
Places are where she was or what she talked about being at, as she phrased them. Keep everything in her own words.`

export async function extract(text: string, names: string[]): Promise<Extraction> {
  const client = new Anthropic()
  const response = await client.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 2000,
    output_config: { effort: 'low', format: zodOutputFormat(Extraction) },
    system: SYSTEM,
    messages: [{ role: 'user', content: `People in her life: ${names.length ? names.join(', ') : '(none listed)'}\n\nEntry:\n${text}` }],
  })
  if (response.stop_reason === 'refusal' || !response.parsed_output) return { people: [], places: [], keywords: [], title: '' }
  return response.parsed_output
}
