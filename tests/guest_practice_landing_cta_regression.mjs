import fs from 'node:fs'

const source=fs.readFileSync('src/guest-practice-cta.ts','utf8')
const main=fs.readFileSync('src/main.tsx','utf8')

for(const marker of ['mx-main-practice-cta','PRACTICE — PLAY AS GUEST','mega-x:start-practice-match','#mx-main-landing']){
  if(!source.includes(marker))throw new Error(`missing guest Practice landing marker: ${marker}`)
}
if(!main.includes("import './guest-practice-cta.ts'"))throw new Error('guest Practice landing CTA is not loaded by main')
console.log('GUEST_PRACTICE_LANDING_CTA_PASS')
