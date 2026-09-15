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
      applyOnlineMatchView(match as any)
    }
`

app=app.slice(0,start)+replacement+app.slice(listener)
fs.writeFileSync(path,app)
console.log('Patched Practice guest entry to create and open the local match in one click')
