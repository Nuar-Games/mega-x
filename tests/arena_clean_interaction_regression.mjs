import fs from 'node:fs'

const adapter=fs.readFileSync('src/game/arena/ArenaStateAdapter.ts','utf8')
const cards=fs.readFileSync('src/game/arena/ArenaCards.ts','utf8')
const input=fs.readFileSync('src/game/arena/ArenaInput.ts','utf8')
const inspect=fs.readFileSync('src/game/arena/ArenaInspect.ts','utf8')
const scene=fs.readFileSync('src/game/arena/ArenaScene.ts','utf8')
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}

must(adapter.includes('actionId?:string'),'card refs must carry authoritative action ids')
must(adapter.includes("button.dataset.arenaActionId=id"),'authoritative DOM actions must receive stable ids')
must(cards.includes('this.dispatch(card.actionId)'),'playable hand cards must dispatch authoritative actions')
must(cards.includes('this.inspect(card)'),'field cards must open native inspect view')
must(input.includes("filter(action=>/quit|audio/i.test(action.label))"),'utility controls must be separated from combat commands')
must(inspect.includes('/cards/inspect/'),'inspection must request high-resolution card assets')
must(scene.includes('new ArenaInspect(this)'),'scene must own native card inspection')
must(scene.includes('new ArenaCards(this,dispatch,card=>this.inspectLayer.show(card))'),'card renderer must share the arena dispatcher and inspection layer')
console.log('PASS clean arena native interaction contract')
