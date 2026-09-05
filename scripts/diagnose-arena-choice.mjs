import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
const needles = ['pendingChoice','CONFIRM DISCARD','SAHKAN BUANG','PILIH KAD UNTUK','choice-panel','choice-overlay','pending-choice']
for (const needle of needles) {
  let from = 0
  let count = 0
  while (count < 12) {
    const at = app.indexOf(needle, from)
    if (at < 0) break
    const start = Math.max(0, at - 420)
    const end = Math.min(app.length, at + 900)
    console.log(`\n=== CHOICE DIAG ${needle} #${count + 1} @ ${at} ===\n${app.slice(start,end)}\n`)
    from = at + needle.length
    count += 1
  }
  console.log(`CHOICE_DIAG_COUNT ${needle} ${count}`)
}
