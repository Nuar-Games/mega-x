import Phaser from 'phaser'
import type { ArenaLayoutSnapshot } from './ArenaLayout'
import type { ArenaRenderState, ArenaStats } from './ArenaStateAdapter'
import { ARENA_THEME } from './arena-theme'
import { ARENA_ASSETS } from './ArenaAssets'

export class ArenaHud{
  private objects:Phaser.GameObjects.GameObject[]=[]
  constructor(private scene:Phaser.Scene){}
  clear(){this.objects.forEach(obj=>obj.destroy());this.objects=[]}
  private keep<T extends Phaser.GameObjects.GameObject>(obj:T){this.objects.push(obj);return obj}
  private text(x:number,y:number,value:string,size:number,color='#f4f7fb',originX=0,originY=0.5,font='Oxanium'){
    return this.keep(this.scene.add.text(x,y,value,{fontFamily:`${font}, sans-serif`,fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#02040a',strokeThickness:Math.max(2,size*0.075),letterSpacing:Math.max(0.5,size*0.035)}).setOrigin(originX,originY))
  }
  private fallbackPlate(x:number,y:number,w:number,h:number,side:'player'|'opponent'|'neutral'='neutral'){
    const g=this.keep(this.scene.add.graphics())
    const accent=side==='player'?ARENA_THEME.colors.player:side==='opponent'?ARENA_THEME.colors.opponent:0xd7b35a
    g.fillStyle(0x050811,0.88).fillRoundedRect(x,y,w,h,Math.min(14,h*0.22))
    g.lineStyle(Math.max(1,h*0.025),accent,0.72).strokeRoundedRect(x,y,w,h,Math.min(14,h*0.22))
  }
  private hudFrame(x:number,y:number,w:number,h:number,side:'player'|'opponent'){
    const src=side==='player'?ARENA_ASSETS.arenaUi.hudPlayer:ARENA_ASSETS.arenaUi.hudOpponent
    const key=`asset:${src}`
    if(this.scene.textures.exists(key)) this.keep(this.scene.add.image(x,y,key).setOrigin(0,0).setDisplaySize(w,h).setDepth(2))
    else this.fallbackPlate(x,y,w,h,side)
  }
  private ribbon(x:number,y:number,w:number,h:number){
    const key=`asset:${ARENA_ASSETS.arenaUi.commandRibbon}`
    if(this.scene.textures.exists(key)) this.keep(this.scene.add.image(x,y,key).setOrigin(0,0).setDisplaySize(w,h).setDepth(2))
    else this.fallbackPlate(x,y,w,h,'neutral')
  }
  private combatStats(x:number,y:number,stats:ArenaStats,position:string,align:'left'|'right',accent:number,base:number){
    const g=this.keep(this.scene.add.graphics())
    const dir=align==='left'?1:-1
    const span=base*8.4
    g.lineStyle(Math.max(1,base*0.08),accent,0.58).lineBetween(x,y,x+dir*span,y)
    g.fillStyle(accent,0.9).fillCircle(x,y,Math.max(2,base*0.14))
    const ox=align==='left'?0:1
    this.text(x,y-base*0.9,position||'—',base*0.55,align==='left'?'#9edcff':'#ffacba',ox,0.5,'Barlow Condensed')
    const values=`ATK ${stats.atk}   DEF ${stats.def}   STA ${stats.sta}`
    this.text(x,y+base*0.55,values,base*0.52,'#f4f7fb',ox,0.5,'Barlow Condensed')
  }
  render(state:ArenaRenderState,layout:ArenaLayoutSnapshot){
    this.clear()
    const base=Math.max(12,Math.min(layout.width,layout.height)*0.022)
    const compact=layout.mode==='portrait'
    const plateW=compact?layout.hud.width*0.43:Math.min(layout.hud.width*0.36,420)
    const plateH=layout.hud.height*0.76
    const plateY=layout.hud.y+(layout.hud.height-plateH)/2
    const utilityClearance=compact?Math.min(62,layout.width*0.16):92

    this.hudFrame(layout.hud.x,plateY,plateW,plateH,'player')
    this.hudFrame(layout.hud.x+layout.hud.width-plateW,plateY,plateW,plateH,'opponent')
    this.text(layout.hud.x+utilityClearance,plateY+plateH*0.50,state.playerName.toUpperCase(),base*0.82,'#d9ecff',0,0.5,'Barlow Condensed').setDepth(4)
    this.text(layout.hud.x+layout.hud.width-utilityClearance,plateY+plateH*0.50,state.opponentName.toUpperCase(),base*0.82,'#ffe1e6',1,0.5,'Barlow Condensed').setDepth(4)

    const centerX=layout.combat.x+layout.combat.width/2
    const combatTop=layout.combat.y
    this.text(centerX,combatTop+layout.combat.height*0.035,state.phase.replaceAll('_',' '),base*0.60,'#d7b35a',0.5,0.5,'Oxanium')
    this.text(centerX,combatTop+layout.combat.height*0.095,state.timer,base*1.38,state.timer!=='—'&&Number(state.timer)<=10?'#ff5d72':'#ffffff',0.5,0.5,'Oxanium')
    const statY=layout.combat.y+layout.combat.height*0.90
    this.combatStats(layout.combat.x+layout.combat.width*0.035,statY,state.localStats,state.localPosition,'left',ARENA_THEME.colors.player,base)
    this.combatStats(layout.combat.x+layout.combat.width*0.965,statY,state.opponentStats,state.opponentPosition,'right',ARENA_THEME.colors.opponent,base)

    const promptText=(state.prompt||state.status||state.phase).toUpperCase()
    const promptW=Math.min(layout.prompt.width,compact?layout.width*0.90:640)
    const promptH=Math.min(layout.prompt.height*0.42,38)
    const promptX=layout.width/2-promptW/2
    const promptY=layout.prompt.y+Math.max(2,layout.prompt.height*0.05)
    this.ribbon(promptX,promptY,promptW,promptH)
    this.text(layout.width/2,promptY+promptH/2,promptText,base*0.62,'#ffffff',0.5,0.5,'Barlow Condensed').setDepth(4)

    this.text(layout.deck.x+layout.deck.width/2,layout.deck.y+layout.deck.height*0.86,`${state.deckCount}`,base*0.72,'#f4f7fb',0.5,0.5,'Oxanium')
    this.text(layout.deck.x+layout.deck.width/2,layout.deck.y+layout.deck.height*0.12,'MASTER',base*0.40,'#94a0b2',0.5,0.5,'Barlow Condensed')
    this.text(layout.zonXLeft.x+layout.zonXLeft.width/2,layout.zonXLeft.y+layout.zonXLeft.height*0.92,`X ${state.localZonXCount}`,base*0.48,'#9edcff',0.5,0.5,'Oxanium')
    this.text(layout.zonXRight.x+layout.zonXRight.width/2,layout.zonXRight.y+layout.zonXRight.height*0.92,`X ${state.opponentZonXCount}`,base*0.48,'#ffacba',0.5,0.5,'Oxanium')

    if(state.connection==='degraded'){
      const warningW=Math.min(layout.width*0.62,360),warningH=Math.max(28,base*1.8)
      this.ribbon(layout.width/2-warningW/2,layout.hud.y+layout.hud.height+6,warningW,warningH)
      this.text(layout.width/2,layout.hud.y+layout.hud.height+6+warningH/2,'RECONNECTING',base*0.58,'#ffd36a',0.5,0.5,'Oxanium').setDepth(4)
    }

    if(state.result){
      this.keep(this.scene.add.rectangle(layout.width/2,layout.height/2,layout.width,layout.height,0x02040a,0.82).setDepth(98))
      const flare=this.keep(this.scene.add.graphics().setDepth(99))
      flare.fillStyle(0xffffff,0.05).fillCircle(layout.width/2,layout.height/2,Math.max(layout.width,layout.height)*0.32)
      flare.lineStyle(Math.max(2,base*0.12),0xd7b35a,0.8).strokeCircle(layout.width/2,layout.height/2,Math.max(56,Math.min(layout.width,layout.height)*0.17))
      this.text(layout.width/2,layout.height/2,state.result.toUpperCase(),base*2.1,'#ffffff',0.5,0.5,'Oxanium').setDepth(100)
    }
  }
}
