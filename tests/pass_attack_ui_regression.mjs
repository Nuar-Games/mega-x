import fs from 'node:fs'
const fragment = fs.readFileSync('src/arena-blueprint.fragment','utf8')
const css = fs.readFileSync('src/arena-stage.css','utf8')
const must = (ok,msg) => { if(!ok) throw new Error(msg) }

must(fragment.includes('mx2-command'), 'Arena 2 command surface missing')
must(fragment.includes('game.message'), 'Arena 2 no longer surfaces authoritative blocked-attack messages')
must(css.includes('.mx2-command'), 'Arena 2 command styling missing')
console.log('PASS attack-block feedback remains visible through Arena 2 command/status surfaces')
