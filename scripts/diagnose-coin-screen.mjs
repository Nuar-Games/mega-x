import fs from 'node:fs'
const app=fs.readFileSync('src/App.tsx','utf8')
const needles=['pendingSelfDiscard','sourceEffectSeq','SPUDUR','motionFx','motion-card-fx','hand-card-wrap','discard','confirm']
for(const needle of needles){
  let start=0
  for(let n=0;n<3;n++){
    const i=app.indexOf(needle,start)
    if(i<0) break
    console.log(`=== ${needle} @ ${i} ===`)
    console.log(app.slice(Math.max(0,i-1200),Math.min(app.length,i+2600)))
    start=i+needle.length
  }
}
