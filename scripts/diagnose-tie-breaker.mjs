import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
for (const token of ["'TIE_REVEAL'", "game.phase === 'TIE_BREAKER'", 'PENENTUAN SERI']) {
  const at = app.indexOf(token)
  console.log(`=== TIE DIAG ${token} @ ${at} ===`)
  if (at >= 0) console.log(app.slice(Math.max(0,at-2200), Math.min(app.length,at+4200)))
}
throw new Error('TIE_DIAG_COMPLETE')
