import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
for (const needle of ['discard-panel','SAHKAN BUANG','PILIH KAD UNTUK DIBUANG']) {
  const at = app.indexOf(needle)
  console.log(`=== DISCARD MARKUP ${needle} @ ${at} ===`)
  if (at >= 0) console.log(app.slice(Math.max(0, at - 1800), Math.min(app.length, at + 3600)))
}
