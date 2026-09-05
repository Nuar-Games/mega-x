import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
for (const needle of ['CONFIRM DISCARD','SPUDUR — PILIH KAD UNTUK DIBUANG','SAHKAN BUANG']) {
  let from=0, count=0
  while (true) {
    const at=app.indexOf(needle,from)
    if(at<0) break
    console.log(`\n=== FOCUSED CHOICE ${needle} #${++count} @ ${at} ===\n${app.slice(Math.max(0,at-1800),Math.min(app.length,at+2400))}\n`)
    from=at+needle.length
  }
  console.log(`FOCUSED_CHOICE_COUNT ${needle} ${count}`)
}
