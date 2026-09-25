import assert from 'node:assert/strict'
import { deriveArenaPointerTargets } from '../src/game/arena-next/ArenaPointerTargets.ts'
import { createDesktopPrototypeLayout } from '../src/game/arena-next/prototype/ArenaPrototypeLayout.ts'

const card=(id,name=`CARD ${id}`)=>({id,name,artSrc:`/${id}.webp`,baseAtk:500,baseDef:400,baseSta:3})
const emptyEffects=()=>[null,null,null,null,null]

function baseState(){
  return {
    schemaVersion:1,
    identity:{
      matchId:'pointer-regression',mode:'online',localPlayerIndex:0,
      players:[
        {playerId:'p1',handle:'P1',startRank:null},
        {playerId:'p2',handle:'P2',startRank:null},
      ],
    },
    stateVersion:7,
    phase:'SET_VS',round:1,firstPlayerIndex:0,effectTurnIndex:null,attackTurnIndex:null,
    needsVS:[true,true],deckCount:20,
    players:[
      {playerId:'p1',handle:'P1',startRank:null,hand:[card(1),card(2)],handCount:2,vs:null,effects:emptyEffects(),zonTepi:[],zonX:[],capturedCount:0,stats:null,attackBlocks:0},
      {playerId:'p2',handle:'P2',startRank:null,hand:null,handCount:5,vs:null,effects:emptyEffects(),zonTepi:[],zonX:[],capturedCount:0,stats:null,attackBlocks:0},
    ],
    pendingChoice:null,
    legalCommands:[
      {action:'SET_VS',cardId:1,position:'ATK'},
      {action:'SET_VS',cardId:1,position:'DEF'},
      {action:'SET_VS',cardId:2,position:'ATK'},
      {action:'SET_VS',cardId:2,position:'DEF'},
    ],
    message:'',winnerIndex:null,
    connection:{status:'online',disconnectedPlayerId:null,reconnectDeadline:null,networkBusy:false,lastError:null},
  }
}

const width=1440,height=1000
const layout=createDesktopPrototypeLayout(width,height)
const setVs=deriveArenaPointerTargets(baseState(),width,height)
assert.equal(setVs.length,4,'both ATK/DEF buttons for both legal hand cards must be exposed')
assert.deepEqual(setVs.map(target=>[target.cardId,target.position]),[[1,'ATK'],[1,'DEF'],[2,'ATK'],[2,'DEF']])
assert.ok(setVs.every(target=>target.y===layout.handBand.y+94),'SET_VS targets must use the rendered button row')
assert.ok(new Set(setVs.map(target=>`${target.x},${target.y}`)).size===4,'every SET_VS button must have its own exact coordinate')

const attack=baseState()
attack.phase='ATTACK'
attack.players[0].vs={card:card(9),position:'ATK',staDelta:0,positionChangedThisRound:false,spudurDiscardCount:0}
attack.players[0].stats={atk:900,def:850,sta:5}
attack.legalCommands=[{action:'ATTACK'},{action:'PASS_ATTACK'}]
const attackTargets=deriveArenaPointerTargets(attack,width,height)
assert.deepEqual(attackTargets.map(target=>target.action),['ATTACK','PASS_ATTACK'])
assert.equal(attackTargets[0].x,width/2-59)
assert.equal(attackTargets[1].x,width/2+59)
assert.ok(attackTargets.every(target=>target.y===height*.72))

const board=baseState()
board.phase='EFFECT'
board.players[1].vs={card:card(10),position:'ATK',staDelta:0,positionChangedThisRound:false,spudurDiscardCount:0}
board.pendingChoice={kind:'BOARD',value:{chooser:0,target:1,purpose:'DESTROY_ELIGIBLE',title:'CHOOSE',cardIds:[10]}}
board.legalCommands=[{action:'RESOLVE_BOARD_CHOICE',cardId:10}]
const boardTargets=deriveArenaPointerTargets(board,width,height)
assert.equal(boardTargets.length,1)
assert.equal(boardTargets[0].x,layout.vs[1].x)
assert.equal(boardTargets[0].y,layout.vs[1].y)

const discard=baseState()
discard.phase='EFFECT'
discard.pendingChoice={kind:'SELF_DISCARD',value:{player:0,count:2,mode:'EXACT',reason:'PIPIT'}}
discard.legalCommands=[{action:'RESOLVE_SELF_DISCARD',cardIds:[]}]
const discardTargets=deriveArenaPointerTargets(discard,width,height)
assert.equal(discardTargets.filter(target=>target.action==='SELECT_SELF_DISCARD').length,2)
assert.equal(discardTargets.filter(target=>target.action==='RESOLVE_SELF_DISCARD').length,1)

const busy=baseState()
busy.connection.networkBusy=true
assert.deepEqual(deriveArenaPointerTargets(busy,width,height),[],'busy arena must expose no clickable test targets')

console.log('PASS arena pointer targets expose exact rendered coordinates without canvas probing')
