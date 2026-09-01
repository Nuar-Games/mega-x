import fs from 'node:fs'
const fragment = fs.readFileSync('src/arena-blueprint.fragment','utf8')
const css = fs.readFileSync('src/arena-stage.css','utf8')
const must = (ok,msg) => { if(!ok) throw new Error(msg) }

must(fragment.includes('mx3-phase-prompt'), 'Arena MX3 phase/attack surface missing')
must(fragment.includes('game.message'), 'Arena MX3 no longer surfaces authoritative match status')
must(fragment.includes('canBegin') && fragment.includes('onClick={beginRound}') && fragment.includes('mx3-begin-round'), 'Arena MX3 lost the legal SET_VS to Effect-phase progression control')
must(fragment.includes("game.phase === 'ATTACK'") && fragment.includes('passAttack(game.attackTurn!)'), 'Arena MX3 attack/pass controls missing')
must(css.includes('.mx3-phase-prompt'), 'Arena MX3 phase prompt styling missing')
must(css.includes('.mx3-begin-round'), 'Arena MX3 begin-round control is not visibly styled')
console.log('PASS Arena MX3 exposes beginRound progression and attack/pass controls')
