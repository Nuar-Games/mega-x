import type { ArenaRenderState } from './ArenaStateAdapter'
import { ARENA_ASSETS } from './ArenaAssets'

export class ArenaAudio{
  private previous:ArenaRenderState|null=null
  private enabled=true
  setEnabled(value:boolean){this.enabled=value}
  sync(next:ArenaRenderState){
    if(!this.enabled){this.previous=next;return}
    const prev=this.previous
    if(prev){
      if(prev.localHand.length<next.localHand.length)this.play(ARENA_ASSETS.audio.cardDraw)
      if(prev.localVs?.src!==next.localVs?.src||prev.opponentVs?.src!==next.opponentVs?.src)this.play(ARENA_ASSETS.audio.cardEnterVs)
      if(prev.phase!==next.phase&&next.phase==='ATTACK')this.play(ARENA_ASSETS.audio.promptNeeded)
      if(!prev.result&&next.result)this.play(ARENA_ASSETS.audio.winLose)
    }
    this.previous=next
  }
  private play(src:string){
    const audio=new Audio(src)
    audio.volume=0.72
    audio.play().catch(()=>{})
  }
}
