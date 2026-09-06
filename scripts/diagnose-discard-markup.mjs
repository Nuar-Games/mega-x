import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
const needles = ['function CardView','const CardView','CardView =','className="digital-card"','className={`digital-card']
for (const needle of needles) {
  const at = app.indexOf(needle)
  console.log(`=== CARDVIEW DIAG ${needle} @ ${at} ===`)
  if (at >= 0) console.log(app.slice(Math.max(0, at - 2500), Math.min(app.length, at + 6500)))
}
