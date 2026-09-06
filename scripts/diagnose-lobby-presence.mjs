import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
for (const needle of ['heartbeatLobby(', 'getOnlineFighters(', "onlineScreen === 'LOBBY'", 'refreshLobby']) {
  let from = 0, n = 0
  while (true) {
    const i = app.indexOf(needle, from)
    if (i < 0) break
    n++
    console.log(`=== ${needle} #${n} @ ${i} ===`)
    console.log(app.slice(Math.max(0,i-900), Math.min(app.length,i+1800)))
    from = i + needle.length
  }
  if (!n) console.log(`=== ${needle}: NONE ===`)
}
