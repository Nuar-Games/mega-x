import fs from 'node:fs'
const fragment=fs.readFileSync('src/arena-blueprint.fragment','utf8')
const css=fs.readFileSync('src/arena-stage.css','utf8')
const main=fs.readFileSync('src/main.tsx','utf8')
const audio=fs.readFileSync('src/audio.ts','utf8')
const assets=fs.readFileSync('src/audio-assets.ts','utf8')
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'))
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
for(const token of ['mx3-canvas','mx3-vs-left','mx3-effects-left','mx3-big-counter','mx3-master-counter','mx3-stats','mx3-local-hand','mx3-opponent-hand']) must(fragment.includes(token)||css.includes(token),`Arena MX3 token missing: ${token}`)
for(const token of ['mx2-','VSZone','LiveStats','pile-cluster','effect-card-slot','fighter-identity','v9-vs-card','mx-vs-module','mx-effect-column','arena-wrap','hand-card-wrap']) { must(!fragment.includes(token),`legacy Arena presentation survived in fragment: ${token}`); must(!css.includes(token),`legacy Arena presentation survived in stylesheet: ${token}`) }
must(main.includes("import './arena-stage.css'"),'single Arena stylesheet missing')
must(!main.includes('arena-action.css'),'second Arena action stylesheet still imported')
must(!main.includes('arena-overlay.css'),'second Arena overlay stylesheet still imported')
must(!audio.includes("playSfx('fight')"),'FIGHT announcer playback still exists')
must(!/\bFIGHT\b/.test(audio),'FIGHT announcer detection still exists')
must(!assets.includes("'fight'"),'FIGHT SFX type still exists')
must(!assets.includes('/fight.opus'),'FIGHT SFX asset mapping still exists')
must(!pkg.scripts.build.includes('patch-single-fight.mjs'),'obsolete FIGHT patch still runs')
console.log('PASS Arena MX3 contains no prior Arena presentation, one stylesheet only, no FIGHT announcer')
