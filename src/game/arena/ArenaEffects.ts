import Phaser from 'phaser'
import type { ArenaRenderState } from './ArenaStateAdapter'
import { ARENA_THEME } from './arena-theme'
import { ARENA_ASSETS } from './ArenaAssets'
import { chooseArenaPerformanceProfile } from './ArenaPerformance'

export class ArenaEffects{
  private profile=chooseArenaPerformanceProfile()
  constructor(private scene:Phaser.Scene){}

  private phaseSweep(color:number){
    if(this.profile.quality==='low')return
    const w=this.scene.scale.width
    const h=this.scene.scale.height
    const beam=this.scene.add.graphics().setDepth(88)
    beam.fillStyle(color,0.16)
    beam.fillPoints([
      new Phaser.Geom.Point(-w*0.25,h*0.18),
      new Phaser.Geom.Point(w*0.04,h*0.18),
      new Phaser.Geom.Point(w*0.34,h*0.82),
      new Phaser.Geom.Point(w*0.05,h*0.82),
    ],true)
    beam.x=-w*0.35
    this.scene.tweens.add({targets:beam,x:w*1.35,alpha:0,duration:ARENA_THEME.motion.normal*1.5,ease:'Cubic.easeOut',onComplete:()=>beam.destroy()})
  }

  private shards(color:number){
    const key=`asset:${ARENA_ASSETS.arenaUi.fxShard}`
    if(!this.scene.textures.exists(key))return
    const w=this.scene.scale.width,h=this.scene.scale.height
    const cx=w/2,cy=h*0.48
    for(let i=0;i<this.profile.maxParticles;i++){
      const angle=Phaser.Math.FloatBetween(-Math.PI,Math.PI)
      const distance=Phaser.Math.Between(Math.round(Math.min(w,h)*0.09),Math.round(Math.min(w,h)*0.25))
      const shard=this.scene.add.image(cx,cy,key).setTint(color).setAlpha(0.86).setScale(Phaser.Math.FloatBetween(0.08,0.19)).setRotation(angle).setDepth(96)
      this.scene.tweens.add({targets:shard,x:cx+Math.cos(angle)*distance,y:cy+Math.sin(angle)*distance,rotation:angle+Phaser.Math.FloatBetween(-1.4,1.4),alpha:0,scale:0,duration:Phaser.Math.Between(260,480),ease:'Quad.easeOut',onComplete:()=>shard.destroy()})
    }
  }

  private impact(color:number){
    const w=this.scene.scale.width
    const h=this.scene.scale.height
    const x=w/2
    const y=h*0.48
    const slash=this.scene.add.graphics().setDepth(95)
    slash.lineStyle(Math.max(4,Math.min(w,h)*0.010),color,0.88)
    slash.lineBetween(x-w*0.15,y+h*0.065,x+w*0.15,y-h*0.065)
    slash.lineStyle(Math.max(1,Math.min(w,h)*0.0035),0xffffff,0.82)
    slash.lineBetween(x-w*0.10,y+h*0.045,x+w*0.10,y-h*0.045)
    slash.setScale(0.2)
    this.shards(color)
    this.scene.tweens.add({targets:slash,scale:1.35,alpha:0,duration:ARENA_THEME.motion.fast*2,ease:'Quint.easeOut',onComplete:()=>slash.destroy()})
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

    if(prev.phase!=='ATTACK'&&next.phase==='ATTACK'&&this.profile.quality!=='low'){
      const pulse=this.scene.add.circle(this.scene.scale.width/2,this.scene.scale.height*0.48,Math.max(40,Math.min(this.scene.scale.width,this.scene.scale.height)*0.1),0xffffff,0.07).setDepth(87)
      pulse.setScale(0.1)
      this.scene.tweens.add({targets:pulse,scale:3.2,alpha:0,duration:ARENA_THEME.motion.normal*2,onComplete:()=>pulse.destroy()})
    }

    if(!prev.result&&next.result){
      this.scene.cameras.main.flash(ARENA_THEME.motion.result,255,255,255,false)
      if(this.profile.quality!=='low'){
        this.scene.cameras.main.zoomTo(1.028,ARENA_THEME.motion.result,'Sine.easeOut',true)
        this.scene.time.delayedCall(ARENA_THEME.motion.result,()=>this.scene.cameras.main.zoomTo(1,ARENA_THEME.motion.normal))
      }
    }
  }
}
