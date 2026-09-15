import Phaser from 'phaser'
import type { ArenaLayoutSnapshot } from './ArenaLayout'
import type { ArenaRenderState } from './ArenaStateAdapter'
import { ARENA_THEME } from './arena-theme'

export class ArenaHud{
  private scene:Phaser.Scene
  private objects:Phaser.GameObjects.GameObject[]=[]
  constructor(scene:Phaser.Scene){this.scene=scene}
  clear(){this.objects.forEach(obj=>obj.destroy());this.objects=[]}
  private keep<T extends Phaser.GameObjects.GameObject>(obj:T){this.objects.push(obj);return obj}
  private text(x:number,y:number,value:string,size:number,color='#f4f7fb',originX=0,originY=0.5,font='Oxanium'){
    return this.keep(this.scene.add.text(x,y,value,{fontFamily:`${font}, sans-serif`,fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#02040a',strokeThickness:Math.max(2,size*0.075),letterSpacing:Math.max(0.5,size*0.035)}).setOrigin(originX,originY))
  }
  private plate(x:number,y:number,w:number,h:number,side:'player'|'opponent'|'neutral'='neutral'){
    const g=this.keep(this.scene.add.graphics())
    const accent=side==='player'?ARENA_THEME.colors.player:side==='opponent'?ARENA_THEME.colors.opponent:0xd7b35a
    g.fillStyle(0x050811,0.88)
    g.fillRoundedRect(x,y,w,h,Math.min(14,h*0.22))
    g.lineStyle(Math.max(1,h*0.025),accent,0.72)
    g.strokeRoundedRect(x,y,w,h,Math.min(14,h*0.22))
    g.fillStyle(accent,0.95)
    const notch=Math.max(4,h*0.12)
    if(side==='opponent') g.fillTriangle(x+w-notch*2,y+h,x+w,y+h,x+w,y+h-notch*2)
    else g.fillTriangle(x,y+h-notch*2,x,y+h,x+notch*2,y+h)
    return g
  }
  render(state:ArenaRenderState,layout:ArenaLayoutSnapshot){
    this.clear()
    const base=Math.max(12,Math.min(layout.width,layout.height)*0.022)
    const compact=layout.mode==='portrait'
    const plateW=compact?layout.hud.width*0.43:Math.min(layout.hud.width*0.36,420)
    const plateH=layout.hud.height*0.76
    const plateY=layout.hud.y+(layout.hud.height-plateH)/2

    this.plate(layout.hud.x,plateY,plateW,plateH,'player')
    this.plate(layout.hud.x+layout.hud.width-plateW,plateY,plateW,plateH,'opponent')
    this.text(layout.hud.x+plateH*0.22,plateY+plateH*0.48,state.playerName.toUpperCase(),base*0.82,'#d9ecff',0,0.5,'Barlow Condensed')
    this.text(layout.hud.x+layout.hud.width-plateH*0.22,plateY+plateH*0.48,state.opponentName.toUpperCase(),base*0.82,'#ffe1e6',1,0.5,'Barlow Condensed')

    const centerX=layout.combat.x+layout.combat.width/2
    const combatTop=layout.combat.y
    this.text(centerX,combatTop+layout.combat.height*0.045,state.phase.replaceAll('_',' '),base*0.60,'#d7b35a',0.5,0.5,'Oxanium')
    this.text(centerX,combatTop+layout.combat.height*0.115,state.timer,base*1.45,state.timer!=='—'&&Number(state.timer)<=10?'#ff5d72':'#ffffff',0.5,0.5,'Oxanium')

    const promptText=(state.prompt||state.status||state.phase).toUpperCase()
    const promptW=Math.min(layout.prompt.width, compact?layout.width*0.88:620)
    const promptH=Math.min(layout.prompt.height*0.82,64)
    const promptX=layout.width/2-promptW/2
    const promptY=layout.prompt.y+(layout.prompt.height-promptH)/2
    this.plate(promptX,promptY,promptW,promptH,'neutral')
    this.text(layout.width/2,promptY+promptH/2,promptText,base*0.72,'#ffffff',0.5,0.5,'Barlow Condensed')

    this.text(layout.deck.x+layout.deck.width/2,layout.deck.y+layout.deck.height*0.86,`${state.deckCount}`,base*0.72,'#f4f7fb',0.5,0.5,'Oxanium')
    this.text(layout.deck.x+layout.deck.width/2,layout.deck.y+layout.deck.height*0.12,'MASTER',base*0.40,'#94a0b2',0.5,0.5,'Barlow Condensed')

    if(state.connection==='degraded'){
      const warningW=Math.min(layout.width*0.62,360)
      const warningH=Math.max(28,base*1.8)
      this.plate(layout.width/2-warningW/2,layout.hud.y+layout.hud.height+6,warningW,warningH,'neutral')
      this.text(layout.width/2,layout.hud.y+layout.hud.height+6+warningH/2,'RECONNECTING',base*0.58,'#ffd36a',0.5,0.5,'Oxanium')
    }

    if(state.result){
      const veil=this.keep(this.scene.add.rectangle(layout.width/2,layout.height/2,layout.width,layout.height,0x02040a,0.82).setDepth(98))
      void veil
      const flare=this.keep(this.scene.add.graphics().setDepth(99))
      flare.fillStyle(0xffffff,0.05).fillCircle(layout.width/2,layout.height/2,Math.max(layout.width,layout.height)*0.32)
      flare.lineStyle(Math.max(2,base*0.12),0xd7b35a,0.8).strokeCircle(layout.width/2,layout.height/2,Math.max(56,Math.min(layout.width,layout.height)*0.17))
      this.text(layout.width/2,layout.height/2,state.result.toUpperCase(),base*2.1,'#ffffff',0.5,0.5,'Oxanium').setDepth(100)
    }
  }
}
