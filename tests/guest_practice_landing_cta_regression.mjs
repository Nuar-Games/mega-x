import fs from 'node:fs'

const source=fs.readFileSync('src/guest-practice-cta.ts','utf8')
const main=fs.readFileSync('src/main.tsx','utf8')

for(const marker of ['mx-main-sign-in','SIGN IN','mega-x:start-practice-match','mega-x:open-sign-in','#mx-main-landing','mx-main-practice-cta']){
  if(!source.includes(marker))throw new Error(`missing guest-first landing marker: ${marker}`)
}
if(source.includes('PRACTICE — PLAY AS GUEST'))throw new Error('separate guest Practice CTA survived guest-first redesign')
if(!main.includes("import './guest-practice-cta.ts'"))throw new Error('guest-first landing behavior is not loaded by main')
console.log('GUEST_FIRST_LANDING_PASS')
