import fs from 'node:fs'

const appPath='src/App.tsx'
let app=fs.readFileSync(appPath,'utf8')

const oldDispatch=`      const result = await submitMatchEngineAction(onlineSession, activeOnlineMatch.id, activeOnlineMatch.state_version, action, payload)\n      const nextMatch: ActiveOnlineMatch = { ...activeOnlineMatch, state: result.state, state_version: Number(result.state_version), phase: result.phase, status: result.status }`
const newDispatch=`      const matchId = activeOnlineMatch.id\n      let expectedVersion = activeOnlineMatch.state_version\n      let result\n      try {\n        result = await submitMatchEngineAction(onlineSession, matchId, expectedVersion, action, payload)\n      } catch (error) {\n        const message = error instanceof Error ? error.message : ''\n        if (!message.includes('STALE_MATCH_STATE')) throw error\n        const fresh = await refreshActiveMatch()\n        if (!fresh || fresh.id !== matchId) throw error\n        expectedVersion = fresh.state_version\n        result = await submitMatchEngineAction(onlineSession, matchId, expectedVersion, action, payload)\n      }\n      const nextMatch: ActiveOnlineMatch = { ...activeOnlineMatch, id: matchId, state: result.state, state_version: Number(result.state_version), phase: result.phase, status: result.status }`
if(app.includes(oldDispatch)) app=app.replace(oldDispatch,newDispatch)
else if(!app.includes("if (!message.includes('STALE_MATCH_STATE')) throw error")) throw new Error('dispatchOnlineAction stale-state retry anchor missing')

const oldLanding=`          {!activeOnlineMatch && <button className="mx-practice-now" onClick={() => window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))}>PRACTICE — PLAY AS GUEST</button>}`
const newLanding=`          {!activeOnlineMatch && <button className="mx-practice-now" onClick={() => window.dispatchEvent(new CustomEvent('mega-x:enter-guest-lobby'))}>PLAY AS GUEST</button>}`
if(app.includes(oldLanding)) app=app.replace(oldLanding,newLanding)
else if(!app.includes("mega-x:enter-guest-lobby")) throw new Error('guest landing CTA anchor missing')

const listenerAnchor=`    const openGuestSignIn = () => {\n      setOnlineScreen('AUTH')\n    }\n    window.addEventListener('mega-x:open-sign-in', openGuestSignIn)\n    window.addEventListener('mega-x:start-practice-match', startPractice)`
const listenerReplacement=`    const openGuestSignIn = () => {\n      setOnlineScreen('AUTH')\n    }\n    const enterGuestLobby = () => {\n      const guestKey = 'mega-x-practice-guest-id-v1'\n      let guestId = onlineSession?.userId || window.localStorage.getItem(guestKey)\n      if (!guestId) {\n        guestId = 'practice-guest:' + crypto.randomUUID()\n        window.localStorage.setItem(guestKey, guestId)\n      }\n      if (!onlineSession) setOnlineSession({\n        accessToken: 'practice-local',\n        refreshToken: 'practice-local',\n        expiresAt: Number.MAX_SAFE_INTEGER,\n        userId: guestId,\n      })\n      setOnlineScreen('LOBBY')\n    }\n    window.addEventListener('mega-x:open-sign-in', openGuestSignIn)\n    window.addEventListener('mega-x:enter-guest-lobby', enterGuestLobby)\n    window.addEventListener('mega-x:start-practice-match', startPractice)`
if(app.includes(listenerAnchor)) app=app.replace(listenerAnchor,listenerReplacement)
else if(!app.includes("window.addEventListener('mega-x:enter-guest-lobby', enterGuestLobby)")) throw new Error('guest lobby listener anchor missing')

const cleanupOld=`{ window.removeEventListener('mega-x:open-sign-in', openGuestSignIn); window.removeEventListener('mega-x:start-practice-match', startPractice) }`
const cleanupNew=`{ window.removeEventListener('mega-x:open-sign-in', openGuestSignIn); window.removeEventListener('mega-x:enter-guest-lobby', enterGuestLobby); window.removeEventListener('mega-x:start-practice-match', startPractice) }`
if(app.includes(cleanupOld)) app=app.replace(cleanupOld,cleanupNew)
else if(!app.includes("window.removeEventListener('mega-x:enter-guest-lobby', enterGuestLobby)")) throw new Error('guest lobby cleanup anchor missing')

const lobbyStatus=`        {onlineMessage && <div className="mx-live-status mx-lobby-status" role="status">{onlineMessage}</div>}`
const guestBanner=`        {onlineMessage && <div className="mx-live-status mx-lobby-status" role="status">{onlineMessage}</div>}\n        {onlineSession?.accessToken === 'practice-local' && <div className="mx-guest-banner" role="status">\n          <strong>PLAYING AS GUEST</strong>\n          <span>POINTS AND LEADERBOARD PROGRESS ARE NOT RECORDED FOR GUEST MATCHES.</span>\n          <button className="mx-guest-practice-start" onClick={() => window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))}>START PRACTICE MATCH</button>\n        </div>}`
if(app.includes(lobbyStatus)&&!app.includes('mx-guest-practice-start')) app=app.replace(lobbyStatus,guestBanner)
else if(!app.includes('mx-guest-practice-start')) throw new Error('lobby guest banner anchor missing')

fs.writeFileSync(appPath,app)
console.log('Patched guest shared-lobby entry and one-retry stale SET_VS race handling')
