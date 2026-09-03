import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
const probes = ['mx-rank-card','leaderboardRows.slice(0, 3)','TOP 20 X FIGHTERS']
for (const probe of probes) {
  const i = app.indexOf(probe)
  console.log(`\n=== ${probe} @ ${i} ===`)
  if (i >= 0) console.log(app.slice(Math.max(0,i-1200), Math.min(app.length,i+2200)))
}
