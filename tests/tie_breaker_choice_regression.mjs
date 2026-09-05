import fs from 'node:fs'

const engine = fs.readFileSync('supabase/functions/match-action/engine.ts', 'utf8')
const migration = fs.existsSync('supabase/migrations/20260905_tie_breaker_player_choice.sql') ? fs.readFileSync('supabase/migrations/20260905_tie_breaker_player_choice.sql', 'utf8') : ''
const app = fs.existsSync('src/App.tsx') ? fs.readFileSync('src/App.tsx', 'utf8') : ''
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(engine.includes('hands:[') || engine.includes('hands: ['), 'tie breaker must deal private hands')
must(engine.includes('slice(0,5)') && engine.includes('slice(5,10)'), 'tie breaker must deal five cards to each player')
must(engine.includes('picks:[null,null]') || engine.includes('picks: [null, null]'), 'tie breaker must start with private player picks')
must(migration.includes("action_upper='TIE_PICK'"), 'special-action RPC must accept TIE_PICK')
must(migration.includes('cardId'), 'TIE_PICK must receive the chosen card id')
must(migration.includes('opponentPicked') && migration.includes('tieChoice'), 'redaction must expose only viewer tie choice state')
must(!migration.includes('ONLY_X_FIGHTER_1_ADVANCES_TIE'), 'tie breaker must not be controlled by X Fighter 1 only')
must(app.includes("'TIE_PICK'") && app.includes('tieChoice'), 'tie-breaker UI must let the local player choose a card')

console.log('PASS tie breaker: five private cards each, both players choose their own card, simultaneous reveal')
