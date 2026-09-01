import fs from 'node:fs'

const fragment = fs.readFileSync('src/arena-blueprint.fragment','utf8')
const css = fs.readFileSync('src/arena-stage.css','utf8')
const audio = fs.readFileSync('src/audio.ts','utf8')
const patch = fs.readFileSync('scripts/patch-single-fight.mjs','utf8')
const must = (ok,msg) => { if(!ok) throw new Error(msg) }

for (const token of ['mx2-arena','mx2-vs-frame','mx2-effect-rail','mx2-score-core','mx2-deck-core','mx2-stats']) {
  must(fragment.includes(token) || css.includes(token), `new Arena token missing: ${token}`)
}

for (const token of ['VSZone','LiveStats','pile-cluster','effect-card-slot','fighter-identity','v9-vs-card','mx-vs-module','mx-effect-column','arena-wrap']) {
  must(!fragment.includes(token), `legacy Arena presentation survived in fragment: ${token}`)
  must(!css.includes(token), `legacy Arena presentation survived in stylesheet: ${token}`)
}

must(!audio.includes("playSfx('fight')"), 'FIGHT announcer playback still exists')
must(!/\\bFIGHT\\b/.test(audio), 'FIGHT announcer mutation detection still exists')
must(!patch.includes("playSfx('fight')"), 'single-FIGHT patch can reintroduce announcer')

console.log('PASS total Arena redesign contains no legacy presentation and no FIGHT announcer')
