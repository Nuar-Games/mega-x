import fs from 'node:fs'
const fragment = fs.readFileSync('src/arena-blueprint.fragment','utf8')
const css = fs.readFileSync('src/arena-stage.css','utf8')
const must = (ok,msg) => { if(!ok) throw new Error(msg) }

must(fragment.includes('mx3-phase-prompt'), 'Arena MX3 phase/attack surface missing')
must(fragment.includes('game.message'), 'Arena MX3 no longer surfaces authoritative match status')
must(fragment.includes("game.phase === 'ATTACK'") && fragment.includes('passAttack(game.attackTurn!)'), 'Arena MX3 attack/pass controls missing')
must(css.includes('.mx3-phase-prompt'), 'Arena MX3 phase prompt styling missing')
console.log('PASS attack-block feedback remains visible through Arena MX3 status/phase surfaces')
