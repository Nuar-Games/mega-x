import fs from 'node:fs'

const migration = fs.existsSync('supabase/migrations/20260905_tie_breaker_player_choice.sql') ? fs.readFileSync('supabase/migrations/20260905_tie_breaker_player_choice.sql', 'utf8') : ''
const controller = fs.readFileSync('src/game/arena-next/live/ArenaLiveController.ts', 'utf8')
const projection = fs.readFileSync('src/game/arena-next/live/ArenaStateProjection.ts', 'utf8')
const surface = fs.readFileSync('src/game/arena-next/ArenaCommandSurface.ts', 'utf8')
const scene = fs.readFileSync('src/game/arena-next/prototype/ArenaPrototypeScene.ts', 'utf8')
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(migration.includes("action_upper='TIE_PICK'"), 'special-action RPC must accept TIE_PICK')
must(migration.includes('tie_index+5') && migration.includes('tie_index+10'), 'tie breaker must deal five private cards to each player')
must(migration.includes("'picks','[null,null]'::jsonb"), 'tie breaker must reset private player picks')
must(migration.includes('TIE_CARD_NOT_IN_YOUR_HAND'), 'player must only choose from their own five-card hand')
must(migration.includes('opponentPicked') && migration.includes('tieChoice'), 'redaction must expose only viewer tie choice state')
must(migration.includes("s:=s-'tieBreaker'"), 'private tie deck, hands and picks must be removed from client state')
must(!migration.includes('ONLY_X_FIGHTER_1_ADVANCES_TIE'), 'tie breaker must not be controlled by X Fighter 1 only')

must(controller.includes("'TIE_PICK'"), 'ArenaLiveController must route TIE_PICK through the live command path')
must(projection.includes("pending.kind==='TIE'") && projection.includes("commands.push({action:'TIE_PICK',cardId:card.id})"), 'ArenaStateProjection must expose legal TIE_PICK commands for the local private tie hand')
must(surface.includes("case 'TIE_PICK'"), 'ArenaCommandSurface must expose tie-card interaction targets')
must(scene.includes("target.kind==='TIE_CARD'") && scene.includes("state.pendingChoice?.kind==='TIE'"), 'ArenaPrototypeScene must render the private tie hand as an interactive choice surface')
must(scene.includes("this.commandDispatcher?.(command)"), 'tie-breaker UI must dispatch the selected TIE_PICK command')
must(!controller.includes("'TIE_REVEAL'") && !surface.includes("'TIE_REVEAL'") && !scene.includes("'TIE_REVEAL'"), 'legacy server-random tie reveal must stay removed from the live arena')

console.log('PASS tie breaker: five private cards each, both players choose their own card through Arena Next')
