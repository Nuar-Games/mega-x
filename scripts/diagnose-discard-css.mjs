import fs from 'node:fs'

const files = fs.readdirSync('src').filter((name) => name.endsWith('.css'))
const needles = ['digital-card','discard-card-grid','discard-card-choice','discard-check','discard-panel']
for (const name of files) {
  const text = fs.readFileSync(`src/${name}`,'utf8')
  const lines = text.split('\n')
  const hits = []
  for (let i=0;i<lines.length;i++) {
    if (needles.some((needle) => lines[i].includes(needle))) {
      hits.push(`${i+1}: ${lines[i]}`)
    }
  }
  if (hits.length) {
    console.log(`=== DISCARD CSS ${name} (${hits.length} hits) ===`)
    console.log(hits.slice(0,220).join('\n'))
  }
}
