import fs from 'node:fs'
import path from 'node:path'
for (const name of fs.readdirSync('src').filter((n) => n.endsWith('.css'))) {
  const file = path.join('src', name)
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\n/)
  const hits = lines.map((line, i) => ({line, i:i+1})).filter(({line}) => /discard-card|discard-panel|choice-panel|digital-card/.test(line))
  if (hits.length) {
    console.log(`=== FINAL DISCARD CSS ${name} ===`)
    for (const {line,i} of hits) console.log(`${i}: ${line}`)
  }
}
