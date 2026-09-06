import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
for (const needle of ['discard-panel','SAHKAN BUANG','PILIH KAD UNTUK DIBUANG','function CardView','const CardView','className="digital-card"']) {
  const at = app.indexOf(needle)
  console.log(`=== DISCARD DIAG ${needle} @ ${at} ===`)
  if (at >= 0) console.log(app.slice(Math.max(0, at - 2200), Math.min(app.length, at + 5200)))
}
