import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const auth = fs.readFileSync('src/onlineAuth.ts', 'utf8')

function assert(ok, msg) { if (!ok) throw new Error(msg) }

assert(app.includes("dispatchOnlineAction('SET_VS', { cardId, position })"), 'online SET_VS dispatch path missing')
assert(app.includes("dispatchOnlineAction('PLAY_EFFECT', { cardId })"), 'online PLAY_EFFECT dispatch path missing')
assert(app.includes("submitMatchEngineAction(onlineSession, activeOnlineMatch.id, activeOnlineMatch.state_version, 'ATTACK', {})"), 'online ATTACK engine path missing')
const passViaDispatch = /dispatchOnlineAction\(\s*['\"]PASS['\"]/.test(app)
const passViaEngine = /submitMatchEngineAction\([\s\S]{0,500}?['\"]PASS['\"]/.test(app)
assert(passViaDispatch || passViaEngine, 'online PASS authoritative path missing')
assert(app.includes('matchNetworkBusyRef.current = true'), 'synchronous network action lock missing')
assert(app.includes('matchNetworkBusyRef.current = false'), 'network action unlock missing')
assert(auth.includes('submitMatchEngineAction'), 'match engine transport helper missing')
assert(auth.includes('match-action'), 'match-action edge-function endpoint missing')

console.log('PASS online SET_VS, PLAY_EFFECT, ATTACK and PASS remain wired through the authoritative match-action path')
