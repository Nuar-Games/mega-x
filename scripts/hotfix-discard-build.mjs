import fs from 'node:fs'

const target = 'scripts/patch-arena-ownership-choice.mjs'
let source = fs.readFileSync(target, 'utf8')
const app = fs.readFileSync('src/App.tsx', 'utf8')
const at = app.indexOf('SAHKAN BUANG')
if (at < 0) throw new Error('SAHKAN BUANG markup missing')
throw new Error('DISCARD_MARKUP\n' + app.slice(Math.max(0, at - 2200), Math.min(app.length, at + 1400)))
