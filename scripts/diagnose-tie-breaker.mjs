import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
for (const token of ['TIE_BREAKER','TIE_REVEAL','PENENTUAN SERI','tiePublic']) {
  let at = 0
  while ((at = app.indexOf(token, at)) >= 0) {
    console.log(`=== TIE DIAG ${token} @ ${at} ===`)
    console.log(app.slice(Math.max(0,at-1200), Math.min(app.length,at+2200)))
    at += token.length
  }
}
