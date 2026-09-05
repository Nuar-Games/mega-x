import fs from 'node:fs'
const fragment = fs.readFileSync('src/arena-blueprint.fragment','utf8')
const app = fs.readFileSync('src/App.tsx','utf8')
const must = (ok,msg) => { if(!ok) throw new Error(msg) }

must(fragment.includes("{bottomPlayer === 0 ? 'ANDA' : 'LAWAN'}</span><strong>{playerDisplayName(0)}</strong>"), 'left fighter ownership must follow local player identity')
must(fragment.includes("{bottomPlayer === 1 ? 'ANDA' : 'LAWAN'}</span><strong>{playerDisplayName(1)}</strong>"), 'right fighter ownership must follow local player identity')
must(fragment.includes("{bottomPlayer === 0 ? 'VS ANDA' : 'VS LAWAN'}"), 'left VS ownership label must be player-relative')
must(fragment.includes("{bottomPlayer === 1 ? 'VS ANDA' : 'VS LAWAN'}"), 'right VS ownership label must be player-relative')
must(!fragment.includes('KAD VS X FIGHTER 1') && !fragment.includes('KAD VS X FIGHTER 2'), 'legacy numbered VS ownership labels must be removed')
must(fragment.includes("title: `${bottomPlayer === 0 ? 'ANDA' : 'LAWAN'} · ZON X`"), 'P1 pile ownership title must be player-relative')
must(fragment.includes("title: `${bottomPlayer === 1 ? 'ANDA' : 'LAWAN'} · ZON X`"), 'P2 pile ownership title must be player-relative')

must(!app.includes('mx-discard-confirm-sheet'), 'legacy duplicate discard sheet must not coexist with shared choice overlay')
must(!app.includes('CONFIRM DISCARD'), 'legacy duplicate discard confirmation action must be removed')
must(app.includes('choice-overlay') && app.includes('discard-panel') && app.includes('SAHKAN BUANG'), 'shared authoritative discard choice overlay must remain')
must(app.includes('game.pendingBoardChoice') && app.includes('pendingChoice && passToPlayer === null'), 'shared non-discard card-choice flows must remain authoritative')

console.log('PASS arena ownership follows local player perspective and shared card-choice UI has one authoritative surface')
