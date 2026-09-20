import fs from 'node:fs'

const appPath = 'src/App.tsx'
const authPath = 'src/onlineAuth.ts'
let app = fs.readFileSync(appPath, 'utf8')
let auth = fs.readFileSync(authPath, 'utf8')

if (!auth.includes("from '@supabase/supabase-js'")) {
  auth = "import { createClient } from '@supabase/supabase-js'\n" + auth
}

const helper = `
const REALTIME_CLIENT = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

export function subscribeToMatchChanges(session: OnlineSession, matchId: string, onChange: () => void, onStatus?: (healthy: boolean) => void) {
  if (isPracticeMatchId(matchId)) { onStatus?.(true); return () => onStatus?.(false) }
  let disposed = false
  let channel: ReturnType<typeof REALTIME_CLIENT.channel> | null = null
  void REALTIME_CLIENT.realtime.setAuth(session.accessToken).then(() => {
    if (disposed) return
    channel = REALTIME_CLIENT
      .channel(\`mega-x-match:\${matchId}\`, { config: { private: true } })
      .on('broadcast', { event: 'match_updated' }, () => onChange())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onStatus?.(true)
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') onStatus?.(false)
      })
  }).catch(() => onStatus?.(false))
  return () => {
    disposed = true
    onStatus?.(false)
    if (channel) void REALTIME_CLIENT.removeChannel(channel)
  }
}
`
if (!auth.includes('export function subscribeToMatchChanges')) auth += helper

if (!app.includes('subscribeToMatchChanges')) {
  app = app.replace('resolveReconnectTimeout, sendChallenge', 'resolveReconnectTimeout, sendChallenge, subscribeToMatchChanges')
}

const oldBlock = `    void heartbeatMatch(onlineSession, activeOnlineMatch.id).catch(() => undefined)
    const heartbeatTimer = window.setInterval(() => { void heartbeatMatch(onlineSession, activeOnlineMatch.id).catch(() => undefined) }, 10_000)
    let pollTimer = 0
    const schedulePoll = () => {
      pollTimer = window.setTimeout(async () => {
        if (disposed) return
        await poll()
        if (!disposed) schedulePoll()
      }, 650)
    }
    void poll().finally(schedulePoll)
    return () => { disposed = true; window.clearInterval(heartbeatTimer); window.clearTimeout(pollTimer) }
`
const newBlock = `    void heartbeatMatch(onlineSession, activeOnlineMatch.id).catch(() => undefined)
    const heartbeatTimer = window.setInterval(() => { void heartbeatMatch(onlineSession, activeOnlineMatch.id).catch(() => undefined) }, 20_000)
    let fallbackTimer = 0
    let signalTimer = 0
    let refreshing = false
    const refreshFromServer = async () => {
      if (disposed || refreshing) return
      refreshing = true
      try { await poll() } finally { refreshing = false }
    }
    const unsubscribeMatch = subscribeToMatchChanges(onlineSession, activeOnlineMatch.id, () => {
      window.clearTimeout(signalTimer)
      signalTimer = window.setTimeout(() => { void refreshFromServer() }, 40)
    })
    const scheduleFallback = () => {
      const delay = document.visibilityState === 'hidden' ? 15_000 : 5_000
      fallbackTimer = window.setTimeout(async () => {
        if (disposed) return
        await refreshFromServer()
        if (!disposed) scheduleFallback()
      }, delay)
    }
    void refreshFromServer().finally(scheduleFallback)
    return () => {
      disposed = true
      unsubscribeMatch()
      window.clearInterval(heartbeatTimer)
      window.clearTimeout(signalTimer)
      window.clearTimeout(fallbackTimer)
    }
`
if (!app.includes(oldBlock)) throw new Error('realtime-load match polling target missing')
app = app.replace(oldBlock, newBlock)

fs.writeFileSync(appPath, app)
fs.writeFileSync(authPath, auth)
console.log('Replaced high-frequency match polling with private Realtime broadcast wakeups plus low-rate fallback')
