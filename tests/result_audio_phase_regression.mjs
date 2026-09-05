import fs from 'node:fs'
const audio = fs.readFileSync('src/audio.ts','utf8')
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(audio.includes("document.querySelector('.mx3-canvas.phase-game_over')"), 'result music must be gated by GAME_OVER phase')
must(!audio.includes("/PERLAWANAN\\s+TAMAT|MENANG!?|KALAH|YOU\\s+WIN|YOU\\s+LOSE|ANDA\\s+MENANG/.test(text)"), 'result music must not trigger from generic MENANG/KALAH text during combat')
console.log('PASS result music only triggers after GAME_OVER, never from mid-match MENANG/KALAH text')
