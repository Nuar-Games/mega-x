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
    return this.keep(this.scene.add.text(x,y,value,{fontFamily:`${font}, sans-serif`,fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#02040a',strokeThickness:Math.max(2,size*0.07),letterSpacing:Math.max(0.4,size*0.03)}).setOrigin(originX,originY))
  }
  private image(src:string,x:number,y:number,w:number,h:number,depth=2,alpha=1){
    const key=`asset:${src}`
    if(!this.scene.textures.exists(key))return
    return this.keep(this.scene.add.image(x,y,key).setOrigin(0,0).setDisplaySize(w,h).setDepth(depth).setAlpha(alpha))
  }
  private portrait(src:string,x:number,y:number,w:number,h:number,flip=false){
    const key=`asset:${src}`
    if(!this.scene.textures.exists(key))return
    const img=this.keep(this.scene.add.image(x,y,key).setOrigin(0.5,1).setDisplaySize(w,h).setDepth(3).setAlpha(0.72))
    if(flip)img.setFlipX(true)
    return img
  }
  private combatStats(x:number,y:number,stats:ArenaStats,position:string,align:'left'|'right',accent:number,base:number){
    const dir=align==='left'?1:-1
    const span=base*7.4
    const g=this.keep(this.scene.add.graphics().setDepth(6))
    g.lineStyle(Math.max(1,base*0.07),accent,0.72).lineBetween(x,y,x+dir*span,y)
    g.fillStyle(accent,1).fillCircle(x,y,Math.max(2,base*0.13))
    const ox=align==='left'?0:1
    this.text(x,y-base*0.78,position||'—',base*0.48,align==='left'?'#9edcff':'#ffacba',ox,0.5,'Barlow Condensed').setDepth(7)
    this.text(x,y+base*0.48,`ATK ${stats.atk}   DEF ${stats.def}   STA ${stats.sta}`,base*0.47,'#f4f7fb',ox,0.5,'Barlow Condensed').setDepth(7)
  }
  render(state:ArenaRenderState,layout:ArenaLayoutSnapshot){
    this.clear()
    const base=Math.max(12,Math.min(layout.width,layout.height)*0.022)
    const compact=layout.mode==='portrait'
    const plateW=compact?layout.hud.width*0.49:Math.min(layout.hud.width*0.43,690)
    const plateH=compact?layout.hud.height*0.94:Math.min(layout.hud.height*1.28,154)
    const plateY=layout.hud.y+Math.max(0,(layout.hud.height-plateH)/2)
    const rightX=layout.hud.x+layout.hud.width-plateW

    this.image(ARENA_ASSETS.arenaUi.hudPlayer,layout.hud.x,plateY,plateW,plateH,2,1)
    this.image(ARENA_ASSETS.arenaUi.hudOpponent,rightX,plateY,plateW,plateH,2,1)

    if(!compact){
      const portraitH=plateH*1.18,portraitW=Math.min(plateW*0.24,portraitH*0.72)
      this.portrait(ARENA_ASSETS.vs.player,layout.hud.x+portraitW*0.48,plateY+plateH*1.05,portraitW,portraitH)
      this.portrait(ARENA_ASSETS.vs.opponent,rightX+plateW-portraitW*0.48,plateY+plateH*1.05,portraitW,portraitH,true)
    }

    this.text(layout.hud.x+plateW*(compact?0.11:0.24),plateY+plateH*0.50,state.playerName.toUpperCase(),base*0.86,'#e6f7ff',0,0.5,'Barlow Condensed').setDepth(6)
    this.text(rightX+plateW*(compact?0.89:0.76),plateY+plateH*0.50,state.opponentName.toUpperCase(),base*0.86,'#ffe7ea',1,0.5,'Barlow Condensed').setDepth(6)

    const centerX=layout.combat.x+layout.combat.width/2
    if(!compact){
      const logoW=Math.min(205,layout.width*0.11),logoH=Math.min(68,layout.hud.height*0.58)
      this.image(ARENA_ASSETS.logo,centerX-logoW/2,layout.hud.y-1,logoW,logoH,7,1)
    }

    const phaseW=compact?Math.min(layout.width*0.54,260):Math.min(layout.width*0.24,420)
    const phaseH=compact?Math.min(58,layout.hud.height*0.54):Math.min(70,layout.height*0.072)
    const phaseY=compact?layout.hud.y+layout.hud.height*0.18:layout.combat.y+Math.max(4,layout.combat.height*0.01)
    this.image(ARENA_ASSETS.arenaUi.turnBanner,centerX-phaseW/2,phaseY,phaseW,phaseH,9,1)
    this.text(centerX,phaseY+phaseH*0.38,state.phase.replaceAll('_',' '),base*0.60,'#ffe27a',0.5,0.5,'Oxanium').setDepth(11)
    this.text(centerX,phaseY+phaseH*0.72,state.timer==='—'?'BATTLE':state.timer,base*0.45,state.timer!=='—'&&Number(state.timer)<=10?'#ff7182':'#ffffff',0.5,0.5,'Oxanium').setDepth(11)

    const statY=layout.combat.y+layout.combat.height*0.91
    this.combatStats(layout.combat.x+layout.combat.width*0.03,statY,state.localStats,state.localPosition,'left',ARENA_THEME.colors.player,base)
    this.combatStats(layout.combat.x+layout.combat.width*0.97,statY,state.opponentStats,state.opponentPosition,'right',ARENA_THEME.colors.opponent,base)

    const promptText=(state.prompt||state.status||state.phase).toUpperCase()
    const promptW=Math.min(layout.prompt.width,compact?layout.width*0.90:860)
    const promptH=Math.min(layout.prompt.height*0.46,58)
    const promptX=layout.prompt.x+(layout.prompt.width-promptW)/2
    const promptY=layout.prompt.y+Math.max(1,layout.prompt.height*0.02)
    this.image(ARENA_ASSETS.arenaUi.turnBanner,promptX,promptY,promptW,promptH,3,0.98)
    this.text(promptX+promptW/2,promptY+promptH/2,promptText,base*0.58,'#ffffff',0.5,0.5,'Barlow Condensed').setDepth(5)

    this.text(layout.effectLeft.x+layout.effectLeft.width/2,layout.effectLeft.y+layout.effectLeft.height*0.93,'EFFECT',base*0.31,'#8fe7ff',0.5,0.5,'Barlow Condensed').setDepth(6)
    this.text(layout.effectRight.x+layout.effectRight.width/2,layout.effectRight.y+layout.effectRight.height*0.93,'EFFECT',base*0.31,'#ff9daa',0.5,0.5,'Barlow Condensed').setDepth(6)
    this.text(layout.discard.x+layout.discard.width/2,layout.discard.y+layout.discard.height*0.94,'DISCARD',base*0.34,'#d2dae2',0.5,0.5,'Barlow Condensed').setDepth(6)
    this.text(layout.deck.x+layout.deck.width/2,layout.deck.y+layout.deck.height*0.94,`${state.deckCount} DECK`,base*0.36,'#dff7ff',0.5,0.5,'Barlow Condensed').setDepth(6)
    this.text(layout.zonXLeft.x+layout.zonXLeft.width/2,layout.zonXLeft.y+layout.zonXLeft.height*0.96,`ZON X  ${state.localZonXCount}`,base*0.35,'#ffe27a',0.5,0.5,'Oxanium').setDepth(6)
    this.text(layout.zonXRight.x+layout.zonXRight.width/2,layout.zonXRight.y+layout.zonXRight.height*0.96,`ZON X  ${state.opponentZonXCount}`,base*0.35,'#ffe27a',0.5,0.5,'Oxanium').setDepth(6)

    if(!compact){
      const logW=Math.min(380,layout.width*0.20),logH=Math.min(185,layout.height*0.19)
      const logX=Math.max(18,layout.discard.x),logY=Math.min(layout.height-logH-18,layout.combat.y+layout.combat.height*0.54)
      this.image(ARENA_ASSETS.arenaUi.gameLog,logX,logY,logW,logH,12,0.98)
      this.text(logX+logW*0.08,logY+logH*0.18,'GAME LOG',base*0.43,'#8ce5ff',0,0.5,'Oxanium').setDepth(14)
      this.text(logX+logW*0.08,logY+logH*0.42,state.phase.replaceAll('_',' '),base*0.36,'#ffffff',0,0.5,'Barlow Condensed').setDepth(14)
      this.text(logX+logW*0.08,logY+logH*0.64,(state.status||state.prompt||'BATTLE ACTIVE').slice(0,42).toUpperCase(),base*0.31,'#c9d7df',0,0.5,'Barlow Condensed').setDepth(14)
      this.text(logX+logW*0.08,logY+logH*0.82,`${state.playerName.toUpperCase()}  VS  ${state.opponentName.toUpperCase()}`,base*0.28,'#e7bd4d',0,0.5,'Barlow Condensed').setDepth(14)
    }

    if(state.connection==='degraded')this.text(layout.width/2,layout.hud.y+layout.hud.height+base*0.55,'RECONNECTING',base*0.48,'#ffd36a',0.5,0.5,'Oxanium').setDepth(8)

    if(state.result){
      this.keep(this.scene.add.rectangle(layout.width/2,layout.height/2,layout.width,layout.height,0x010207,0.86).setDepth(98))
      const fw=Math.min(layout.width*0.86,900),fh=Math.min(layout.height*0.54,520)
      this.image(ARENA_ASSETS.arenaUi.resultFrame,layout.width/2-fw/2,layout.height/2-fh/2,fw,fh,99,1)
      this.text(layout.width/2,layout.height/2,state.result.toUpperCase(),base*2.05,'#fff3b0',0.5,0.5,'Oxanium').setDepth(100)
    }
  }
}
