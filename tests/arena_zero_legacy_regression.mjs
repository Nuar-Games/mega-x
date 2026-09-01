import fs from 'node:fs'

const fragment = fs.readFileSync('src/arena-blueprint.fragment','utf8')
const css = fs.readFileSync('src/arena-stage.css','utf8')
const action = fs.readFileSync('src/arena-action.css','utf8')
const audio = fs.readFileSync('src/audio.ts','utf8')
const assets = fs.readFileSync('src/audio-assets.ts','utf8')
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'))
const must = (ok,msg) => { if(!ok) throw new Error(msg) }

for (const token of ['mx2-arena','mx2-vs-frame','mx2-effect-rail','mx2-score-core','mx2-deck-core','mx2-stats','mx2-local-hand','mx2-opponent-hand']) {
  must(fragment.includes(token) || css.includes(token), `new Arena token missing: ${token}`)
}

const prohibited = ['VSZone','LiveStats','pile-cluster','effect-card-slot','fighter-identity','v9-vs-card','mx-vs-module','mx-effect-column','arena-wrap','hand-card-wrap','motion-card-fx','combat-screen-fx']
for (const token of prohibited) {
  must(!fragment.includes(token), `legacy Arena presentation survived in fragment: ${token}`)
  must(!css.includes(token), `legacy Arena presentation survived in stylesheet: ${token}`)
  must(!action.includes(token), `legacy Arena presentation survived in action layer: ${token}`)
}

must(!audio.includes("playSfx('fight')"), 'FIGHT announcer playback still exists')
must(!/\\bFIGHT\\b/.test(audio), 'FIGHT announcer detection still exists')
must(!assets.includes("'fight'"), 'FIGHT SFX type still exists')
must(!assets.includes('/fight.opus'), 'FIGHT SFX asset mapping still exists')
must(!pkg.scripts.build.includes('patch-single-fight.mjs'), 'obsolete FIGHT patch still runs in build')

console.log('PASS total Arena redesign contains no legacy presentation and no FIGHT announcer')
