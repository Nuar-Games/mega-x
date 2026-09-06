import fs from 'node:fs'
for (const name of ['V24.css','arena-stage.css','arena-usability.css']) {
  const file = `src/${name}`
  if (!fs.existsSync(file)) continue
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\n/)
  const hits = lines.map((line, i) => ({line, i:i+1})).filter(({line}) => /discard-card-grid|discard-card-choice|discard-card-art|discard-panel|\.digital-card|digital-card img|digital-card>img/.test(line))
  if (hits.length) {
    console.log(`=== FINAL DISCARD CSS ${name} ===`)
    for (const {line,i} of hits) console.log(`${i}: ${line}`)
  }
}
