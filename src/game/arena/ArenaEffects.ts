import Phaser from 'phaser'
import type { ArenaRenderState } from './ArenaStateAdapter'
import { ARENA_THEME } from './arena-theme'

export class ArenaEffects{
  constructor(private scene:Phaser.Scene){}

  private phaseSweep(color:number){
    const w=this.scene.scale.width
    const h=this.scene.scale.height
    const beam=this.scene.add.graphics().setDepth(88)
    beam.fillStyle(color,0.20)
    beam.fillPoints([
      new Phaser.Geom.Point(-w*0.25,h*0.12),
      new Phaser.Geom.Point(w*0.08,h*0.12),
      new Phaser.Geom.Point(w*0.42,h*0.88),
      new Phaser.Geom.Point(w*0.09,h*0.88),
    ],true)
    beam.x=-w*0.35
    this.scene.tweens.add({targets:beam,x:w*1.35,alpha:0,duration:ARENA_THEME.motion.normal*1.6,ease:'Cubic.easeOut',onComplete:()=>beam.destroy()})
  }

  private impact(color:number){
    const w=this.scene.scale.width
    const h=this.scene.scale.height
    const x=w/2
    const y=h*0.48
    const slash=this.scene.add.graphics().setDepth(95)
    slash.lineStyle(Math.max(4,Math.min(w,h)*0.012),color,0.92)
    slash.lineBetween(x-w*0.17,y+h*0.08,x+w*0.17,y-h*0.08)
    slash.lineStyle(Math.max(1,Math.min(w,h)*0.004),0xffffff,0.85)
    slash.lineBetween(x-w*0.12,y+h*0.055,x+w*0.12,y-h*0.055)
    slash.setScale(0.2)
    this.scene.tweens.add({targets:slash,scale:1.35,alpha:0,duration:ARENA_THEME.motion.fast*2,ease:'Quint.easeOut',onComplete:()=>slash.destroy()})
    this.scene.cameras.main.shake(ARENA_THEME.motion.fast*1.35,0.007)
  }

  transition(prev:ArenaRenderState|null,next:ArenaRenderState){
    if(!prev)return
    if(prev.phase!==next.phase){
      const color=next.phase.includes('ATTACK')?ARENA_THEME.colors.opponent:next.phase.includes('EFFECT')?ARENA_THEME.colors.player:0xd7b35a
      this.phaseSweep(color)
    }

    const localChanged=prev.localVs?.src!==next.localVs?.src
    const opponentChanged=prev.opponentVs?.src!==next.opponentVs?.src
    if(localChanged||opponentChanged){
      this.impact(localChanged&&opponentChanged?0xffffff:localChanged?ARENA_THEME.colors.player:ARENA_THEME.colors.opponent)
    }

    if(prev.phase!=='ATTACK'&&next.phase==='ATTACK'){
      const pulse=this.scene.add.circle(this.scene.scale.width/2,this.scene.scale.height*0.48,Math.max(40,Math.min(this.scene.scale.width,this.scene.scale.height)*0.1),0xffffff,0.08).setDepth(87)
      pulse.setScale(0.1)
      this.scene.tweens.add({targets:pulse,scale:3.4,alpha:0,duration:ARENA_THEME.motion.normal*2,onComplete:()=>pulse.destroy()})
    }

    if(!prev.result&&next.result){
      this.scene.cameras.main.flash(ARENA_THEME.motion.result,255,255,255,false)
      this.scene.cameras.main.zoomTo(1.035,ARENA_THEME.motion.result,'Sine.easeOut',true)
      this.scene.time.delayedCall(ARENA_THEME.motion.result,()=>this.scene.cameras.main.zoomTo(1,ARENA_THEME.motion.normal))
    }
  }
}
