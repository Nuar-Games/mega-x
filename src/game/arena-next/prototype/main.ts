import { ArenaEventQueue } from '../ArenaEventQueue'
import { createArenaPrototypeGame } from './ArenaPrototypeGame'
import { ArenaPrototypeScene } from './ArenaPrototypeScene'
import { prototypeStateAfter, prototypeStateBefore, prototypeVsSetEvent } from './prototypeFixture'

const game=createArenaPrototypeGame('arena-next-prototype',prototypeStateBefore)
const queue=new ArenaEventQueue()
queue.resetForState(prototypeStateBefore.identity.matchId,prototypeStateBefore.stateVersion)
queue.enqueue(prototypeVsSetEvent)

window.setTimeout(()=>{
  const envelope=queue.shift()
  const scene=game.scene.getScene('arena-prototype') as ArenaPrototypeScene
  if(envelope&&scene)void scene.consumeEvent(envelope,prototypeStateAfter)
},1200)
