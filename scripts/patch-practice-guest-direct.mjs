import fs from 'node:fs'

const path='src/App.tsx'
let app=fs.readFileSync(path,'utf8')
const startMarker='    const startPractice = () => {'
const listenerMarker="    window.addEventListener('mega-x:start-practice-match', startPractice)"
const start=app.indexOf(startMarker)
const listener=app.indexOf(listenerMarker,start)
if(start<0||listener<0) throw new Error('Practice direct-entry anchors missing')

const replacement=`    const startPractice = () => {
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
      const match = startPracticeMatch(practiceSession.userId, fighterProfile?.fighter_handle || 'GUEST X FIGHTER')
      applyOnlineMatchView(match as any, practiceSession)
    }
`

app=app.slice(0,start)+replacement+app.slice(listener)

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
console.log('Patched Practice guest entry to open the local match with an explicit session in the same click')
