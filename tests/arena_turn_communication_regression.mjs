import fs from 'node:fs'

const usability = fs.readFileSync('src/arena-usability.ts','utf8')
const css = fs.readFileSync('src/arena-usability.css','utf8')
const main = fs.readFileSync('src/main.tsx','utf8')

const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(main.includes("import './arena-usability.ts'"), 'arena usability runtime is not loaded')
must(main.includes("import './arena-usability.css'"), 'arena usability stylesheet is not loaded')

must(usability.includes('mx3-turn-communication'), 'persistent arena turn communication missing')
must(usability.includes('GILIRAN ANDA'), 'local turn ownership copy missing')
must(usability.includes('GILIRAN LAWAN'), 'opponent turn ownership copy missing')
must(usability.includes('ANDA ·'), 'local action prefix missing')
must(usability.includes('LAWAN ·'), 'opponent action prefix missing')
must(usability.includes('PILIH KAD VS'), 'VS selection communication missing')
must(usability.includes('PILIH SASARAN'), 'target selection communication missing')
must(usability.includes('SERANG'), 'attack decision communication missing')
must(usability.includes('is-local-turn'), 'local-turn arena state missing')
must(usability.includes('is-opponent-turn'), 'opponent-turn arena state missing')

must(css.includes('.mx3-turn-communication'), 'persistent turn strip styling missing')
must(css.includes('.mx3-fighter.is-local-turn'), 'local fighter active styling missing')
must(css.includes('.mx3-fighter.is-opponent-turn'), 'opponent fighter active styling missing')
must(css.includes('100dvh'), 'dynamic viewport height protection missing')
must(css.includes('overflow-y:auto'), 'scrollable mobile target content missing')

console.log('PASS Arena turn ownership, opponent waiting communication, and mobile target overflow are explicit')
