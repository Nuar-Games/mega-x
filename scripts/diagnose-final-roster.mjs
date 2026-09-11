import fs from 'node:fs'
await import('./patch-practice-real-arena.mjs')
const app = fs.readFileSync('src/App.tsx','utf8')
const auth = fs.readFileSync('src/onlineAuth.ts','utf8')
function show(label, source, needle, before=500, after=1400){
  const i=source.indexOf(needle)
  console.log(`=== ${label} @ ${i} ===`)
  console.log(i<0?'NOT FOUND':source.slice(Math.max(0,i-before),Math.min(source.length,i+after)))
}
show('FINAL getOnlineFighters', auth, 'export async function getOnlineFighters')
show('FINAL refreshLobby', app, 'const refreshLobby = async () =>')
show('FINAL fighter filter', app, "onlineFighters.filter((fighter) => fighter.player_id !== onlineSession?.userId)")
await import('../tests/vs_intro_identity_regression.mjs')
await import('../tests/beginner_bot_regression.mjs')
await import('../tests/practice_real_arena_regression.mjs')
