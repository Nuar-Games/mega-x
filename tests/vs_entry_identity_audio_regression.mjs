import fs from 'node:fs'

const audio = fs.readFileSync('src/audio.ts','utf8')
const arena = fs.readFileSync('src/arena-blueprint.fragment','utf8')
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(audio.includes('card: 0.25'), 'card-selection SFX must be reduced to 0.25 gain')
must(audio.includes('lastArenaVsCardIds'), 'VS-entry fallback must track VS card identity, not occupancy only')
must(audio.includes("zone.dataset.vsCardId"), 'VS-entry fallback must read the rendered VS card id')
must(audio.includes('previous !== cardId && cardId'), 'VS-entry sound must fire when a VS card identity changes')
must(arena.includes('data-vs-card-id={game.players[0].vs?.card.id ?? \'\'}'), 'P1 VS zone must expose authoritative VS card id')
must(arena.includes('data-vs-card-id={game.players[1].vs?.card.id ?? \'\'}'), 'P2 VS zone must expose authoritative VS card id')

console.log('PASS VS entry audio tracks actual card identity and card-selection SFX is reduced')
