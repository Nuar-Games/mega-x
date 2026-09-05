import fs from 'node:fs'

const patch = fs.readFileSync('scripts/patch-critical-gameplay.mjs','utf8')
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(patch.includes("detail: { kind: 'ENTER_VS' }"), 'SET_VS path must explicitly dispatch ENTER_VS audio event')
must(patch.includes("dispatchOnlineAction('SET_VS', { cardId, position })"), 'authoritative online SET_VS action path missing')

console.log('PASS VS entry audio is explicitly dispatched from the SET_VS action path')
