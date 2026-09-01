import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
const shell = app.indexOf('<section className="duel-shell">')
if (shell < 0) throw new Error('duel-shell missing')
console.log('MX_DUEL_CONTEXT_START')
console.log(app.slice(Math.max(0, shell - 7000), Math.min(app.length, shell + 22000)))
console.log('MX_DUEL_CONTEXT_END')
throw new Error('MX_DUEL_CONTEXT_CAPTURED')
