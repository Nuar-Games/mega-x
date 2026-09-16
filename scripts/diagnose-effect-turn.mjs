import fs from 'node:fs'
const app=fs.readFileSync('src/App.tsx','utf8')
for(const needle of ['requestEndEffectTurn','pendingConfirm','confirmAction','END_EFFECT']){
  let from=0,index=-1,count=0
  while((index=app.indexOf(needle,from))>=0&&count<6){
    console.log(`\n--- DIAG ${needle} @ ${index} ---\n${app.slice(Math.max(0,index-900),Math.min(app.length,index+1800))}\n--- END DIAG ---`)
    from=index+needle.length;count++
  }
}
