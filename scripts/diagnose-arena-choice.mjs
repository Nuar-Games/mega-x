import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
for (const needle of ['CONFIRM DISCARD','SPUDUR — PILIH KAD UNTUK DIBUANG','SAHKAN BUANG']) {
  const at=app.indexOf(needle)
  console.log(`\n=== FOCUSED CHOICE ${needle} @ ${at} ===\n${at<0?'NOT FOUND':app.slice(Math.max(0,at-2400),Math.min(app.length,at+3200))}\n`)
}
throw new Error('CHOICE_DIAGNOSTIC_STOP')
