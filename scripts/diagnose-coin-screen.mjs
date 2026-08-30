import fs from 'node:fs'
const app=fs.readFileSync('src/App.tsx','utf8')
const needles=['CHOOSING','WAITING','coinResultStarter','mega-coin','COIN','TOSS']
for(const needle of needles){
  const i=app.indexOf(needle)
  console.log(`=== ${needle} @ ${i} ===`)
  if(i>=0) console.log(app.slice(Math.max(0,i-900),Math.min(app.length,i+1800)))
}
