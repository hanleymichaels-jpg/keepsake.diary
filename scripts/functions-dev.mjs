// Local stand-in for Netlify Functions: serves netlify/functions/*.mts on :8788.
// Vite proxies /api/* here in development. Run with: pnpm dev:api
import http from 'node:http'
import { readdirSync } from 'node:fs'

const routes = new Map()
for (const file of readdirSync(new URL('../netlify/functions/', import.meta.url))) {
  if (!file.endsWith('.mts')) continue
  const mod = await import(new URL(`../netlify/functions/${file}`, import.meta.url))
  if (mod.config?.path && mod.default) routes.set(mod.config.path, mod.default)
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:8788')
  const handler = routes.get(url.pathname)
  if (!handler) { res.writeHead(404); return res.end('no such function') }
  const chunks = []
  for await (const c of req) chunks.push(c)
  const body = Buffer.concat(chunks)
  try {
    const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body })
    const response = await handler(request, {})
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch (e) {
    console.error(e)
    res.writeHead(500, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
  }
}).listen(8788, () => console.log('functions on http://localhost:8788', [...routes.keys()].join(' ')))
