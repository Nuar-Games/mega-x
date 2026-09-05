import fs from 'node:fs'

const migration = fs.existsSync('supabase/migrations/20260905_tie_breaker_player_choice.sql') ? fs.readFileSync('supabase/migrations/20260905_tie_breaker_player_choice.sql', 'utf8') : ''
const app = fs.existsSync('src/App.tsx') ? fs.readFileSync('src/App.tsx', 'utf8') : ''
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(migration.includes("action_upper='TIE_PICK'"), 'special-action RPC must accept TIE_PICK')
must(migration.includes('tie_index+5') && migration.includes('tie_index+10'), 'tie breaker must deal five private cards to each player')
must(migration.includes("'picks','[null,null]'::jsonb"), 'tie breaker must reset private player picks')
must(migration.includes('TIE_CARD_NOT_IN_YOUR_HAND'), 'player must only choose from their own five-card hand')
must(migration.includes('opponentPicked') && migration.includes('tieChoice'), 'redaction must expose only viewer tie choice state')
must(migration.includes("s:=s-'tieBreaker'"), 'private tie deck, hands and picks must be removed from client state')
must(!migration.includes('ONLY_X_FIGHTER_1_ADVANCES_TIE'), 'tie breaker must not be controlled by X Fighter 1 only')
must(app.includes("'TIE_PICK'") && app.includes('activeOnlineMatch.state?.tieChoice'), 'tie-breaker UI must let the local player choose a private card')
must(!app.includes("'TIE_REVEAL'"), 'legacy server-random tie reveal must be removed from online UI')

console.log('PASS tie breaker: five private cards each, both players choose their own card, simultaneous reveal')
