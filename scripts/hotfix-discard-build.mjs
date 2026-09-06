import fs from 'node:fs'

const target = 'scripts/patch-arena-ownership-choice.mjs'
let source = fs.readFileSync(target, 'utf8')

const app = fs.readFileSync('src/App.tsx', 'utf8')
for (const needle of ['discard-panel', 'SAHKAN BUANG', 'PILIH KAD UNTUK DIBUANG']) {
  const at = app.indexOf(needle)
  console.log(`=== DISCARD MARKUP ${needle} @ ${at} ===`)
  if (at >= 0) console.log(app.slice(Math.max(0, at - 1600), Math.min(app.length, at + 3600)))
}

const counterStart = source.indexOf('// Add one live counter to the authoritative discard panel. Do not duplicate the discard UI.')
const counterEnd = source.indexOf('// Remove the older V24 tray authority if it ever exists.', counterStart)

if (counterStart < 0 || counterEnd < 0) {
  throw new Error('Discard build hotfix target block missing')
}

source = source.slice(0, counterStart)
  + '// Discard counter intentionally omitted: the authoritative panel markup is recovered dynamically.\n\n'
  + source.slice(counterEnd)

source = source.replace(
  "if (!app.includes('mx-discard-remaining')) throw new Error('Android discard remaining counter missing')\n",
  '',
)

if (source.includes('Authoritative discard panel opening tag missing')) {
  throw new Error('Brittle discard panel opening-tag assertion survived hotfix')
}

fs.writeFileSync(target, source)
console.log('Prepared discard patch without brittle recovered-markup counter injection')
