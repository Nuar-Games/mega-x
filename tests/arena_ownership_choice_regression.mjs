import fs from 'node:fs'
const fragment = fs.readFileSync('src/arena-blueprint.fragment','utf8')
const app = fs.readFileSync('src/App.tsx','utf8')
const must = (ok,msg) => { if(!ok) throw new Error(msg) }

must(fragment.includes("<strong>{playerDisplayName(0)}</strong><em>#{leaderboardRows.find((row) => row.player_id === activeOnlineMatch?.player1_id)?.place ?? '—'}</em>"), 'left fighter plate must show player name and actual rank only')
must(fragment.includes("<strong>{playerDisplayName(1)}</strong><em>#{leaderboardRows.find((row) => row.player_id === activeOnlineMatch?.player2_id)?.place ?? '—'}</em>"), 'right fighter plate must show player name and actual rank only')
must(!fragment.includes("? 'ANDA' : 'LAWAN'</span><strong>{playerDisplayName") && !fragment.includes("? 'PEMAIN' : 'LAWAN'</span><strong>{playerDisplayName"), 'fighter plates must not show ownership words')
must((fragment.match(/>KAD VS<\/span>/g)||[]).length>=2, 'neutral KAD VS labels missing')
must(!fragment.includes('VS ANDA') && !fragment.includes('VS PEMAIN') && !fragment.includes('VS LAWAN'), 'VS boxes must not show ownership words')
must(!fragment.includes('KAD VS X FIGHTER 1') && !fragment.includes('KAD VS X FIGHTER 2'), 'legacy numbered VS ownership labels must be removed')
must(fragment.includes("title: `${bottomPlayer === 0 ? 'PEMAIN' : 'LAWAN'} · ZON X`"), 'P1 pile ownership title must use PEMAIN/LAWAN terminology')
must(fragment.includes("title: `${bottomPlayer === 1 ? 'PEMAIN' : 'LAWAN'} · ZON X`"), 'P2 pile ownership title must use PEMAIN/LAWAN terminology')

must(!app.includes('mx-discard-confirm-sheet'), 'legacy duplicate discard sheet must not coexist with shared choice overlay')
must(!app.includes('CONFIRM DISCARD'), 'legacy duplicate discard confirmation action must be removed')
must(app.includes('choice-overlay') && app.includes('discard-panel') && app.includes('SAHKAN BUANG'), 'shared authoritative discard choice overlay must remain')
must(app.includes('game.pendingBoardChoice') && app.includes('pendingChoice && passToPlayer === null'), 'shared non-discard card-choice flows must remain authoritative')

console.log('PASS fighter plates are name/rank only, VS labels are neutral, PEMAIN terminology is current, and shared card-choice UI remains authoritative')
