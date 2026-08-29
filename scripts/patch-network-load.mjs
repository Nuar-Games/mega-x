import fs from 'node:fs'

const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')

const replacements = [
  [
`    void heartbeatLobby(onlineSession).then(refreshLobby).catch(() => undefined)
    const heartbeatTimer = window.setInterval(() => { void heartbeatLobby(onlineSession).catch(() => undefined) }, 10_000)
    const refreshTimer = window.setInterval(() => { void refreshLobby() }, 2_000)
    return () => {
      disposed = true
      window.clearInterval(heartbeatTimer)
      window.clearInterval(refreshTimer)
    }
`,
`    void heartbeatLobby(onlineSession).then(refreshLobby).catch(() => undefined)
    const heartbeatTimer = window.setInterval(() => { void heartbeatLobby(onlineSession).catch(() => undefined) }, 10_000)
    let refreshTimer = 0
    const scheduleRefresh = () => {
      refreshTimer = window.setTimeout(async () => {
        if (disposed) return
        await refreshLobby()
        if (!disposed) scheduleRefresh()
      }, 3_000)
    }
    scheduleRefresh()
    return () => {
      disposed = true
      window.clearInterval(heartbeatTimer)
      window.clearTimeout(refreshTimer)
    }
`,
  ],
  [
`    void pollMatchmaking()
    const timer = window.setInterval(() => { void pollMatchmaking() }, 2_000)
    return () => { disposed = true; window.clearInterval(timer) }
`,
`    let timer = 0
    const scheduleMatchmaking = () => {
      timer = window.setTimeout(async () => {
        if (disposed) return
        await pollMatchmaking()
        if (!disposed) scheduleMatchmaking()
      }, 1_500)
    }
    void pollMatchmaking().finally(scheduleMatchmaking)
    return () => { disposed = true; window.clearTimeout(timer) }
`,
  ],
  [
`    void heartbeatMatch(onlineSession, activeOnlineMatch.id).catch(() => undefined)
    const heartbeatTimer = window.setInterval(() => { void heartbeatMatch(onlineSession, activeOnlineMatch.id).catch(() => undefined) }, 10_000)
    const pollTimer = window.setInterval(() => { void poll() }, 850)
    return () => { disposed = true; window.clearInterval(heartbeatTimer); window.clearInterval(pollTimer) }
`,
`    void heartbeatMatch(onlineSession, activeOnlineMatch.id).catch(() => undefined)
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
`,
  ],
]

for (const [from, to] of replacements) {
  if (!app.includes(from)) throw new Error(`network-load patch target missing: ${String(from).slice(0, 120)}`)
  app = app.replace(from, to)
}

fs.writeFileSync(appPath, app)
console.log('Prevented overlapping lobby, matchmaking, and live-match polling requests')
