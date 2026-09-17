import fs from 'node:fs'

const path='src/App.tsx'
let app=fs.readFileSync(path,'utf8')
const startMarker='    const startPractice = () => {'
const listenerMarker="    window.addEventListener('mega-x:start-practice-match', startPractice)"
const start=app.indexOf(startMarker)
const listener=app.indexOf(listenerMarker,start)
if(start<0||listener<0) throw new Error('Practice direct-entry anchors missing')

const replacement=`    const startPractice = () => {
      console.log('[MX_QA] startPractice entry')
      const guestKey = 'mega-x-practice-guest-id-v1'
      let guestId = onlineSession?.userId || window.localStorage.getItem(guestKey)
      if (!guestId) {
        guestId = 'practice-guest:' + crypto.randomUUID()
        window.localStorage.setItem(guestKey, guestId)
      }
      const practiceSession = onlineSession ?? {
        accessToken: 'practice-local',
        refreshToken: 'practice-local',
        expiresAt: Number.MAX_SAFE_INTEGER,
        userId: guestId,
      }
      if (!onlineSession) setOnlineSession(practiceSession)
      console.log('[MX_QA] startPractice before startPracticeMatch')
      const match = startPracticeMatch(practiceSession.userId, fighterProfile?.fighter_handle || 'GUEST X FIGHTER')
      applyOnlineMatchView(match as any, practiceSession)
      console.log('[MX_QA] startPractice after applyOnlineMatchView')
    }
`

app=app.slice(0,start)+replacement+app.slice(listener)

const signInListener=`    const openGuestSignIn = () => {
      setOnlineScreen('AUTH')
    }
    window.addEventListener('mega-x:open-sign-in', openGuestSignIn)
    window.addEventListener('mega-x:start-practice-match', startPractice)`
if(!app.includes(listenerMarker)) throw new Error('Practice start listener missing after entry patch')
app=app.replace(listenerMarker,signInListener)

const cleanupMarker="window.removeEventListener('mega-x:start-practice-match', startPractice)"
if(app.includes(cleanupMarker)){
  app=app.replace(cleanupMarker,`{ window.removeEventListener('mega-x:open-sign-in', openGuestSignIn); ${cleanupMarker} }`)
}

const viewSignature='  function applyOnlineMatchView(match: ActiveOnlineMatch) {'
if(!app.includes(viewSignature)) throw new Error('applyOnlineMatchView signature missing')
app=app.replace(viewSignature,`  function applyOnlineMatchView(match: ActiveOnlineMatch, sessionOverride?: OnlineSession) {
    const activeSession = sessionOverride ?? onlineSession`)

const sessionBlock=`    setActiveOnlineMatch(match)
    if (!onlineSession) return
    const me: PlayerIndex = match.player1_id === onlineSession.userId ? 0 : 1`
if(!app.includes(sessionBlock)) throw new Error('applyOnlineMatchView session block missing')
app=app.replace(sessionBlock,`    setActiveOnlineMatch(match)
    if (!activeSession) return
    const me: PlayerIndex = match.player1_id === activeSession.userId ? 0 : 1`)

app=app.replaceAll('onlineGameFromState(match.state, match, onlineSession.userId)','onlineGameFromState(match.state, match, activeSession.userId)')
app=app.replaceAll('getMatchResultSummary(onlineSession, match.id)','getMatchResultSummary(activeSession, match.id)')

fs.writeFileSync(path,app)
console.log('Patched guest-first Practice entry and exposed a non-blocking sign-in event')
