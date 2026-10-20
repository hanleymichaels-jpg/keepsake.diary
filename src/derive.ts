/** Local stand-in for the extraction job (stage 2 replaces it with a model).
 *  People come from the names list in Settings; keywords are the longer words. */
export function derive(text: string) {
  const lower = text.toLowerCase()
  const names = namesList()
  return {
    people: names.filter((n) => new RegExp(`(^|[^a-z])${escape(n.toLowerCase())}([^a-z]|$)`).test(lower)),
    places: [] as string[],
    keywords: Array.from(new Set(lower.match(/[a-z]{5,}/g) ?? [])).slice(0, 12),
  }
}

export function namesList(): string[] {
  return (localStorage.getItem('names') ?? '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
