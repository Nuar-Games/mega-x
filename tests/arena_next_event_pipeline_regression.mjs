import fs from 'node:fs'
import path from 'node:path'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const root='src/game/arena-next/prototype'
const fixture=fs.readFileSync(path.join(root,'prototypeFixture.ts'),'utf8')
const scene=fs.readFileSync(path.join(root,'ArenaPrototypeScene.ts'),'utf8')
const main=fs.readFileSync(path.join(root,'main.ts'),'utf8')
const all=`${fixture}\n${scene}\n${main}`

must(fixture.includes('prototypeEventSequence'),'Phase 4 fixture must expose prototypeEventSequence')
for(const type of [
  'CARD_DRAWN','EFFECT_PLAYED','EFFECT_TRIGGERED','ATTACK_DECLARED','CARD_CAPTURED',
  'CARD_DESTROYED','CARD_DISCARDED','STAT_CHANGED','PHASE_CHANGED','TURN_CHANGED','STATE_RECONCILED'
]) must(fixture.includes(`type:'${type}'`)||fixture.includes(`type: '${type}'`),`Phase 4 fixture missing ${type}`)

for(const handler of [
  'animateDraw(','animateEffectPlayed(','animateEffectTriggered(','animateAttack(',
  'animateZoneMove(','animateStatChange(','animatePhaseChange(','reconcileState('
]) must(scene.includes(handler),`Phase 4 scene missing ${handler}`)

must(scene.includes('rebuildFromState(nextState)'),'Phase 4 event paths must settle to authoritative next state')
must(main.includes('prototypeEventSequence'),'prototype driver must consume full event sequence')
must(main.includes('await scene.consumeEvent'),'prototype driver must serialize animations')
must(main.includes('ArenaEventQueue'),'prototype driver must keep using the versioned queue')

for(const forbidden of ['from \'react\'','from "react"','MutationObserver','querySelector','button.click','transform: scale','transform:scale'])
  must(!all.includes(forbidden),`Phase 4 must not depend on forbidden legacy/page primitive: ${forbidden}`)

console.log('PASS next arena Phase 4 state-event-animation-settle pipeline')
