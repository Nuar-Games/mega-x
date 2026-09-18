import fs from 'node:fs'

const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')

// 1. dispatchOnlineAction: retry once on STALE_MATCH_STATE instead of silently
// dropping the person's own action. The practice bot advances on its own
// independent timer (including during SET_VS, where it also needs to set its
// own VS card), so its tick can bump state_version between when a human
// action captures expectedVersion and when it actually submits.
const staleOld = `      const result = await submitMatchEngineAction(onlineSession, activeOnlineMatch.id, activeOnlineMatch.state_version, action, payload)
      const nextMatch: ActiveOnlineMatch = { ...activeOnlineMatch, state: result.state, state_version: Number(result.state_version), phase: result.phase, status: result.status }`
const staleNew = `      const matchId = activeOnlineMatch.id
      let expectedVersion = activeOnlineMatch.state_version
      let result
      try {
        result = await submitMatchEngineAction(onlineSession, matchId, expectedVersion, action, payload)
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (!message.includes('STALE_MATCH_STATE')) throw error
        const fresh = await refreshActiveMatch()
        if (!fresh || fresh.id !== matchId) throw error
        expectedVersion = fresh.state_version
        result = await submitMatchEngineAction(onlineSession, matchId, expectedVersion, action, payload)
      }
      const nextMatch: ActiveOnlineMatch = { ...activeOnlineMatch, id: matchId, state: result.state, state_version: Number(result.state_version), phase: result.phase, status: result.status }`
if (app.includes(staleOld)) app = app.replace(staleOld, staleNew)
else if (!app.includes('let expectedVersion = activeOnlineMatch.state_version')) throw new Error('dispatchOnlineAction STALE_MATCH_STATE retry target missing')

// 2. Landing guest button: establish the guest session and enter the shared
// LOBBY, same as registered players, instead of starting a match directly.
const landingOld = `          {!activeOnlineMatch && <button className="mx-practice-now" onClick={() => window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))}>PRACTICE — PLAY AS GUEST</button>}`
const landingNew = `          {!activeOnlineMatch && <button className="mx-practice-now" onClick={() => {
            const guestKey = 'mega-x-practice-guest-id-v1'
            let guestId = onlineSession?.userId || window.localStorage.getItem(guestKey)
            if (!guestId) {
              guestId = 'practice-guest:' + crypto.randomUUID()
              window.localStorage.setItem(guestKey, guestId)
            }
            if (!onlineSession) setOnlineSession({
              accessToken: 'practice-local',
              refreshToken: 'practice-local',
              expiresAt: Number.MAX_SAFE_INTEGER,
              userId: guestId,
            })
            setOnlineScreen('LOBBY')
          }}>PLAY AS GUEST</button>}`
if (app.includes(landingOld)) app = app.replace(landingOld, landingNew)
else if (!app.includes(">PLAY AS GUEST</button>")) throw new Error('landing guest button target missing')

// 3. Lobby: guest banner + the actual practice-start action, now that guests
// land in the lobby instead of skipping straight past it.
const lobbyOld = `        {onlineMessage && <div className="mx-live-status mx-lobby-status" role="status">{onlineMessage}</div>}`
const lobbyNew = `        {onlineMessage && <div className="mx-live-status mx-lobby-status" role="status">{onlineMessage}</div>}
        {onlineSession?.accessToken === 'practice-local' && <div className="mx-guest-banner" role="status">
          <strong>PLAYING AS GUEST</strong>
          <span>POINTS AND LEADERBOARD PROGRESS ARE NOT RECORDED FOR GUEST MATCHES.</span>
          <button className="mx-guest-practice-start" onClick={() => window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))}>START PRACTICE MATCH</button>
        </div>}`
if (app.includes(lobbyOld) && !app.includes('mx-guest-banner')) app = app.replace(lobbyOld, lobbyNew)
else if (!app.includes('mx-guest-banner')) throw new Error('lobby guest banner anchor missing')

fs.writeFileSync(appPath, app)
console.log('Patched: guest lobby routing, guest banner, STALE_MATCH_STATE retry')
