import fs from 'node:fs'

const authPath = 'src/onlineAuth.ts'
const appPath = 'src/App.tsx'
const mainPath = 'src/main.tsx'
let auth = fs.readFileSync(authPath, 'utf8')
let app = fs.readFileSync(appPath, 'utf8')
let main = fs.readFileSync(mainPath, 'utf8')

const oldSub = `export function subscribeToMatchChanges(session: OnlineSession, matchId: string, onChange: () => void) {
  REALTIME_CLIENT.realtime.setAuth(session.accessToken)
  const channel = REALTIME_CLIENT
    .channel(\`mega-x-match:\${matchId}:\${session.userId}\`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'matches', filter: \`id=eq.\${matchId}\`,
    }, () => onChange())
    .subscribe()
  return () => { void REALTIME_CLIENT.removeChannel(channel) }
}`
const newSub = `export function subscribeToMatchChanges(session: OnlineSession, matchId: string, onChange: () => void, onStatus?: (healthy: boolean) => void) {
  REALTIME_CLIENT.realtime.setAuth(session.accessToken)
  const channel = REALTIME_CLIENT
    .channel(\`mega-x-match:\${matchId}:\${session.userId}\`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'matches', filter: \`id=eq.\${matchId}\`,
    }, () => onChange())
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onStatus?.(true)
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') onStatus?.(false)
    })
  return () => { onStatus?.(false); void REALTIME_CLIENT.removeChannel(channel) }
}`
if (!auth.includes(oldSub)) throw new Error('Realtime subscription block missing')
auth = auth.replace(oldSub, newSub)

const oldRealtimeCall = `    const unsubscribeMatch = subscribeToMatchChanges(onlineSession, activeOnlineMatch.id, () => {
      window.clearTimeout(signalTimer)
      signalTimer = window.setTimeout(() => { void refreshFromServer() }, 40)
    })
    const scheduleFallback = () => {
      const delay = document.visibilityState === 'hidden' ? 15_000 : 5_000
`
const newRealtimeCall = `    let realtimeHealthy = false
    const unsubscribeMatch = subscribeToMatchChanges(onlineSession, activeOnlineMatch.id, () => {
      window.clearTimeout(signalTimer)
      signalTimer = window.setTimeout(() => { void refreshFromServer() }, 40)
    }, (healthy) => { realtimeHealthy = healthy })
    const scheduleFallback = () => {
      // Realtime is only an accelerator. If Supabase refuses/limits the channel,
      // ordinary HTTPS polling stays bounded instead of increasing load during degradation.
      const delay = document.visibilityState === 'hidden' ? 30_000 : 5_000
`
if (!app.includes(oldRealtimeCall)) throw new Error('Realtime fallback block missing')
app = app.replace(oldRealtimeCall, newRealtimeCall)

if (!main.includes("serviceWorker.register('/sw.js')")) {
  main += `\n\n// Cache heavy card art locally so repeat play does not repeatedly consume host egress.\nif ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {\n  window.addEventListener('load', () => {\n    navigator.serviceWorker.register('/sw.js').catch(() => undefined)\n  })\n}\n`
}

fs.writeFileSync(authPath, auth)
fs.writeFileSync(appPath, app)
fs.writeFileSync(mainPath, main)

fs.writeFileSync('public/sw.js', `const CACHE = 'mega-x-static-v1';\nconst CARD_RE = /^\\/cards\\//;\nself.addEventListener('install', e => { self.skipWaiting(); });\nself.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });\nself.addEventListener('fetch', event => {\n  const req = event.request;\n  if (req.method !== 'GET') return;\n  const url = new URL(req.url);\n  if (url.origin !== self.location.origin) return;\n  if (CARD_RE.test(url.pathname)) {\n    event.respondWith(caches.open(CACHE).then(async cache => {\n      const hit = await cache.match(req);\n      if (hit) return hit;\n      const res = await fetch(req);\n      if (res.ok) cache.put(req, res.clone());\n      return res;\n    }));\n  }\n});\n`)

console.log('Added Realtime quota fallback and persistent local card cache')
