import Phaser from 'phaser'
import type { ArenaRenderState } from './ArenaStateAdapter'
import { ARENA_THEME } from './arena-theme'
import { ARENA_ASSETS } from './ArenaAssets'
import { chooseArenaPerformanceProfile } from './ArenaPerformance'

export class ArenaEffects{
  private profile=chooseArenaPerformanceProfile()
  constructor(private scene:Phaser.Scene){}

  private effect(src:string,x:number,y:number,w:number,h:number,depth:number,alpha=1){
    const key=`asset:${src}`
    if(!this.scene.textures.exists(key))return null
    return this.scene.add.image(x,y,key).setDisplaySize(w,h).setDepth(depth).setAlpha(alpha)
  }

  private phaseSweep(color:number){
    if(this.profile.quality==='low')return
    const w=this.scene.scale.width,h=this.scene.scale.height
    const ring=this.effect(ARENA_ASSETS.arenaUi.fxRing,w/2,h*0.48,Math.min(w,h)*0.46,Math.min(w,h)*0.46,88,0.72)
    if(ring){
      ring.setTint(color).setScale(0.3)
      this.scene.tweens.add({targets:ring,scale:1.7,alpha:0,duration:ARENA_THEME.motion.normal*1.7,ease:'Cubic.easeOut',onComplete:()=>ring.destroy()})
    }
  }

  private burst(color:number,scale=1){
    if(this.profile.quality==='low'&&scale>1)return
    const w=this.scene.scale.width,h=this.scene.scale.height
    const size=Math.min(w,h)*(this.profile.quality==='low'?0.28:0.42)*scale
    const burst=this.effect(ARENA_ASSETS.arenaUi.fxBurst,w/2,h*0.48,size,size,94,0.82)
    if(!burst)return
    burst.setTint(color).setScale(0.25)
    this.scene.tweens.add({targets:burst,scale:1.25,alpha:0,duration:ARENA_THEME.motion.fast*2.2,ease:'Quad.easeOut',onComplete:()=>burst.destroy()})
  }

  private impact(color:number){
    const w=this.scene.scale.width,h=this.scene.scale.height
    const size=Math.min(w*0.42,h*0.52)
    const slash=this.effect(ARENA_ASSETS.arenaUi.fxSlash,w/2,h*0.48,size*1.55,size,97,0.94)
    const impact=this.effect(ARENA_ASSETS.arenaUi.fxImpact,w/2,h*0.48,size,size,96,0.78)
    if(slash){
      slash.setTint(color).setScale(0.35)
      this.scene.tweens.add({targets:slash,scale:1.25,alpha:0,duration:ARENA_THEME.motion.fast*2,ease:'Quint.easeOut',onComplete:()=>slash.destroy()})
    }
    if(impact){
      impact.setTint(color).setScale(0.18)
      this.scene.tweens.add({targets:impact,scale:1.55,alpha:0,duration:ARENA_THEME.motion.fast*2.4,ease:'Cubic.easeOut',onComplete:()=>impact.destroy()})
    }
    this.burst(color,0.85)
    if(this.profile.cameraShake)this.scene.cameras.main.shake(ARENA_THEME.motion.fast*1.2,0.006)
  }

  transition(prev:ArenaRenderState|null,next:ArenaRenderState){
    if(!prev)return
    if(prev.phase!==next.phase){
      const color=next.phase.includes('ATTACK')?ARENA_THEME.colors.opponent:next.phase.includes('EFFECT')?ARENA_THEME.colors.player:0xd7b35a
      this.phaseSweep(color)
    }

    const localChanged=prev.localVs?.src!==next.localVs?.src
    const opponentChanged=prev.opponentVs?.src!==next.opponentVs?.src
    if(localChanged||opponentChanged)this.impact(localChanged&&opponentChanged?0xffffff:localChanged?ARENA_THEME.colors.player:ARENA_THEME.colors.opponent)

    if(prev.phase!=='ATTACK'&&next.phase==='ATTACK')this.burst(0xffcf55,1.15)

    if(!prev.result&&next.result){
      this.burst(0xffd55f,1.35)
      this.scene.cameras.main.flash(ARENA_THEME.motion.result,255,245,190,false)
      if(this.profile.quality!=='low'){
        this.scene.cameras.main.zoomTo(1.028,ARENA_THEME.motion.result,'Sine.easeOut',true)
        this.scene.time.delayedCall(ARENA_THEME.motion.result,()=>this.scene.cameras.main.zoomTo(1,ARENA_THEME.motion.normal))
      }
    }
  }
}
