import fs from 'node:fs'
const engine = fs.readFileSync('supabase/functions/match-action/engine.ts','utf8')
const checks = [
  ['GRAVITIAN keeps owner Effect Zone', !/function resolveGravitian\([^\n]+\)\{[^}]*clearEffects\(s\)/s.test(engine)],
  ['PIPIT exact-2 then hand-limit', engine.includes("case 30:draw(s,owner,5,false)") && engine.includes("reason:'PIPIT'") && engine.includes("if(reason==='PIPIT')enforceHandLimit")],
  ['PELUNCUR can resolve hand/effect targets', engine.includes("kind==='PELUNCUR'") && engine.includes('target.effects.length')],
  ['BARA blocks position switch', engine.includes('hasEffect(s,other(actor),6)')],
  ['NAGA threshold ATK/DEF <=500', engine.includes('card(id).atk<=500||card(id).def<=500')],
  ['effect-destroyed VS goes Zon Tepi', engine.includes('target.discard.push(c);target.vs=null;finishRound')],
]
let failures = 0
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failures++ }
if (failures) process.exit(1)
