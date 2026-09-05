import fs from 'node:fs'

const usability = fs.readFileSync('src/arena-usability.ts','utf8')
const css = fs.readFileSync('src/arena-usability.css','utf8')
const main = fs.readFileSync('src/main.tsx','utf8')
const roleRuntime = fs.readFileSync('src/arena-player-role.ts','utf8')
const roleCss = fs.readFileSync('src/arena-player-role.css','utf8')

const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(main.includes("import './arena-usability.ts'"), 'arena usability runtime is not loaded')
must(main.includes("import './arena-usability.css'"), 'arena usability stylesheet is not loaded')
must(main.includes("import './arena-player-role.css'"), 'PEMAIN/LAWAN orientation stylesheet is not loaded')
must(main.includes("import './arena-player-role.ts'"), 'PEMAIN/LAWAN orientation runtime is not loaded')

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

must(roleRuntime.includes('mx3-role-label-${side}'), 'PEMAIN/LAWAN side-specific label class generation missing')
must(roleRuntime.includes("ensureRoleLabel(canvas, 'left')"), 'left PEMAIN/LAWAN label missing under Player 1 stats')
must(roleRuntime.includes("ensureRoleLabel(canvas, 'right')"), 'right PEMAIN/LAWAN label missing under Player 2 stats')
must(roleRuntime.includes("leftActive ? 'PEMAIN' : 'LAWAN'"), 'Player 1 PEMAIN/LAWAN turn switch missing')
must(roleRuntime.includes("rightActive ? 'PEMAIN' : 'LAWAN'"), 'Player 2 PEMAIN/LAWAN turn switch missing')
must(roleRuntime.includes("classList.contains('is-active')"), 'PEMAIN/LAWAN labels are not driven by active player state')
must(roleRuntime.includes("classList.toggle('is-player-turn'"), 'active PEMAIN glow class switch missing')
must(roleCss.includes('top:855px'), 'PEMAIN/LAWAN labels are not positioned directly under ATK/DEF/STA')
must(roleCss.includes('.mx3-role-label-left') && roleCss.includes('left:125px'), 'left role label is not aligned with left stats')
must(roleCss.includes('.mx3-role-label-right') && roleCss.includes('left:445px'), 'right role label is not aligned with right stats')
must(roleCss.includes('.mx3-role-label.is-player-turn'), 'active PEMAIN glow styling missing')
must(roleCss.includes('@keyframes mx3PlayerRolePulse'), 'active PEMAIN pulse animation missing')

must(css.includes('.mx3-turn-communication'), 'persistent turn strip styling missing')
must(css.includes('.mx3-fighter.is-local-turn'), 'local fighter active styling missing')
must(css.includes('.mx3-fighter.is-opponent-turn'), 'opponent fighter active styling missing')
must(css.includes('100dvh'), 'dynamic viewport height protection missing')
must(css.includes('overflow-y:auto'), 'scrollable mobile target content missing')

console.log('PASS Arena turn ownership, PEMAIN/LAWAN orientation labels, opponent waiting communication, and mobile target overflow are explicit')
