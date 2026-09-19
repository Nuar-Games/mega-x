import { ArenaEventQueue } from '../ArenaEventQueue'
import { createArenaPrototypeGame } from './ArenaPrototypeGame'
import { ArenaPrototypeScene } from './ArenaPrototypeScene'
import { prototypeEventSequence, prototypeStateBefore } from './prototypeFixture'

const game=createArenaPrototypeGame('arena-next-prototype',prototypeStateBefore)
const queue=new ArenaEventQueue()
queue.resetForState(prototypeStateBefore.identity.matchId,prototypeStateBefore.stateVersion)
for(const step of prototypeEventSequence)queue.enqueue(step.envelope)

const wait=(ms:number)=>new Promise(resolve=>window.setTimeout(resolve,ms))

async function playPrototypeSequence(){
  await wait(900)
  const scene=game.scene.getScene('arena-prototype') as ArenaPrototypeScene
  while(queue.size>0){
    const envelope=queue.shift()
    if(!envelope)break
    const step=prototypeEventSequence.find(item=>item.envelope.sequence===envelope.sequence)
    if(!step)continue
    await scene.consumeEvent(envelope,step.state)
    await wait(220)
  }
}

void playPrototypeSequence()
