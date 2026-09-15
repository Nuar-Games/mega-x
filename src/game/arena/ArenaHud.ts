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
  private combatStats(x:number,y:number,stats:ArenaStats,position:string,align:'left'|'right',accent:number,base:number){
    const dir=align==='left'?1:-1
    const span=base*7.4
    const g=this.keep(this.scene.add.graphics().setDepth(6))
    g.lineStyle(Math.max(1,base*0.07),accent,0.50).lineBetween(x,y,x+dir*span,y)
    g.fillStyle(accent,0.9).fillCircle(x,y,Math.max(2,base*0.13))
    const ox=align==='left'?0:1
    this.text(x,y-base*0.78,position||'—',base*0.48,align==='left'?'#9edcff':'#ffacba',ox,0.5,'Barlow Condensed').setDepth(7)
    this.text(x,y+base*0.48,`ATK ${stats.atk}   DEF ${stats.def}   STA ${stats.sta}`,base*0.47,'#f4f7fb',ox,0.5,'Barlow Condensed').setDepth(7)
  }
  render(state:ArenaRenderState,layout:ArenaLayoutSnapshot){
    this.clear()
    const base=Math.max(12,Math.min(layout.width,layout.height)*0.022)
    const compact=layout.mode==='portrait'
    const plateW=compact?layout.hud.width*0.49:Math.min(layout.hud.width*0.45,520)
    const plateH=layout.hud.height*0.92
    const plateY=layout.hud.y+(layout.hud.height-plateH)/2
    const rightX=layout.hud.x+layout.hud.width-plateW

    this.image(ARENA_ASSETS.arenaUi.hudPlayer,layout.hud.x,plateY,plateW,plateH,2,0.96)
    this.image(ARENA_ASSETS.arenaUi.hudOpponent,rightX,plateY,plateW,plateH,2,0.96)
    this.text(layout.hud.x+plateW*0.09,plateY+plateH*0.54,state.playerName.toUpperCase(),base*0.76,'#d9ecff',0,0.5,'Barlow Condensed').setDepth(4)
    this.text(rightX+plateW*0.91,plateY+plateH*0.54,state.opponentName.toUpperCase(),base*0.76,'#ffe1e6',1,0.5,'Barlow Condensed').setDepth(4)

    const centerX=layout.combat.x+layout.combat.width/2
    this.text(centerX,layout.combat.y+layout.combat.height*0.035,state.phase.replaceAll('_',' '),base*0.52,'#d7b35a',0.5,0.5,'Oxanium').setDepth(8)
    this.text(centerX,layout.combat.y+layout.combat.height*0.095,state.timer,base*1.30,state.timer!=='—'&&Number(state.timer)<=10?'#ff5d72':'#ffffff',0.5,0.5,'Oxanium').setDepth(8)

    const statY=layout.combat.y+layout.combat.height*0.91
    this.combatStats(layout.combat.x+layout.combat.width*0.03,statY,state.localStats,state.localPosition,'left',ARENA_THEME.colors.player,base)
    this.combatStats(layout.combat.x+layout.combat.width*0.97,statY,state.opponentStats,state.opponentPosition,'right',ARENA_THEME.colors.opponent,base)

    const promptText=(state.prompt||state.status||state.phase).toUpperCase()
    const promptW=Math.min(layout.prompt.width,compact?layout.width*0.88:680)
    const promptH=Math.min(layout.prompt.height*0.38,44)
    const promptX=layout.width/2-promptW/2
    const promptY=layout.prompt.y+Math.max(1,layout.prompt.height*0.03)
    this.image(ARENA_ASSETS.arenaUi.turnBanner,promptX,promptY,promptW,promptH,3,0.90)
    this.text(layout.width/2,promptY+promptH/2,promptText,base*0.58,'#ffffff',0.5,0.5,'Barlow Condensed').setDepth(5)

    this.text(layout.discard.x+layout.discard.width/2,layout.discard.y+layout.discard.height*0.94,'DISCARD',base*0.34,'#8f9bad',0.5,0.5,'Barlow Condensed').setDepth(6)
    this.text(layout.deck.x+layout.deck.width/2,layout.deck.y+layout.deck.height*0.94,`${state.deckCount} DECK`,base*0.36,'#d9e1ea',0.5,0.5,'Barlow Condensed').setDepth(6)
    this.text(layout.zonXLeft.x+layout.zonXLeft.width/2,layout.zonXLeft.y+layout.zonXLeft.height*0.96,`ZON X  ${state.localZonXCount}`,base*0.35,'#9edcff',0.5,0.5,'Oxanium').setDepth(6)
    this.text(layout.zonXRight.x+layout.zonXRight.width/2,layout.zonXRight.y+layout.zonXRight.height*0.96,`ZON X  ${state.opponentZonXCount}`,base*0.35,'#ffacba',0.5,0.5,'Oxanium').setDepth(6)

    if(state.connection==='degraded')this.text(layout.width/2,layout.hud.y+layout.hud.height+base*0.55,'RECONNECTING',base*0.48,'#ffd36a',0.5,0.5,'Oxanium').setDepth(8)

    if(state.result){
      this.keep(this.scene.add.rectangle(layout.width/2,layout.height/2,layout.width,layout.height,0x010207,0.86).setDepth(98))
      const fw=Math.min(layout.width*0.86,900),fh=Math.min(layout.height*0.54,520)
      this.image(ARENA_ASSETS.arenaUi.resultFrame,layout.width/2-fw/2,layout.height/2-fh/2,fw,fh,99,1)
      this.text(layout.width/2,layout.height/2,state.result.toUpperCase(),base*2.05,'#ffffff',0.5,0.5,'Oxanium').setDepth(100)
    }
  }
}
