import Phaser from 'phaser'
import type { ArenaRenderState } from './ArenaStateAdapter'
import { ARENA_THEME } from './arena-theme'

export class ArenaEffects{
  constructor(private scene:Phaser.Scene){}
  transition(prev:ArenaRenderState|null,next:ArenaRenderState){
    if(!prev)return
    if(prev.phase!==next.phase){
      const flash=this.scene.add.rectangle(this.scene.scale.width/2,this.scene.scale.height/2,this.scene.scale.width,this.scene.scale.height,0xffffff,0.12).setDepth(90)
      this.scene.tweens.add({targets:flash,alpha:0,duration:ARENA_THEME.motion.normal,onComplete:()=>flash.destroy()})
    }
    if(prev.localVs?.src!==next.localVs?.src||prev.opponentVs?.src!==next.opponentVs?.src){
      this.scene.cameras.main.shake(ARENA_THEME.motion.fast,0.004)
    }
    if(!prev.result&&next.result){
      this.scene.cameras.main.flash(ARENA_THEME.motion.result,255,255,255,false)
    }
  }
}
