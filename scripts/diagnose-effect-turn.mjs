import fs from 'node:fs'
const app=fs.readFileSync('src/App.tsx','utf8')
for(const needle of ['confirmEndWithoutEffect','setConfirmEndWithoutEffect','TAMAT TANPA EFFECT','requestEndEffectTurn','END_EFFECT_TURN']){
  let from=0,index=-1,count=0
  while((index=app.indexOf(needle,from))>=0&&count<12){
    console.log(`\n--- DIAG ${needle} @ ${index} ---\n${app.slice(Math.max(0,index-1600),Math.min(app.length,index+2400))}\n--- END DIAG ---`)
    from=index+needle.length;count++
  }
}
