import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
const needles = ['function CardView','const CardView','CardView =','className="digital-card"','className={`digital-card','PILIH KAD UNTUK DIBUANG','Pilih tepat','discard-card-grid']
for (const needle of needles) {
  const at = app.indexOf(needle)
  console.log(`=== DISCARD DIAG ${needle} @ ${at} ===`)
  if (at >= 0) console.log(app.slice(Math.max(0, at - 1800), Math.min(app.length, at + 4200)))
}
