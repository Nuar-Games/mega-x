import Phaser from 'phaser'
import type { ArenaLayoutSnapshot } from './ArenaLayout'
import type { ArenaRenderState } from './ArenaStateAdapter'
import { ARENA_THEME } from './arena-theme'

export class ArenaHud{
  private scene:Phaser.Scene
  private objects:Phaser.GameObjects.GameObject[]=[]
  constructor(scene:Phaser.Scene){this.scene=scene}
  clear(){this.objects.forEach(obj=>obj.destroy());this.objects=[]}
  private text(x:number,y:number,value:string,size:number,color='#f4f7fb',originX=0,originY=0.5){
    const t=this.scene.add.text(x,y,value,{fontFamily:'Arial Narrow, Arial, sans-serif',fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#000000',strokeThickness:Math.max(2,size*0.08)}).setOrigin(originX,originY)
    this.objects.push(t);return t
  }
  render(state:ArenaRenderState,layout:ArenaLayoutSnapshot){
    this.clear()
    const base=Math.max(12,Math.min(layout.width,layout.height)*0.022)
    this.text(layout.hud.x,layout.hud.y+layout.hud.height/2,state.playerName,base*1.15,'#8ec7ff')
    this.text(layout.hud.x+layout.hud.width,layout.hud.y+layout.hud.height/2,state.opponentName,base*1.15,'#ff9cab',1)
    this.text(layout.combat.x+layout.combat.width/2,layout.combat.y+layout.combat.height*0.46,'VS',base*2.25,'#ffffff',0.5)
    this.text(layout.prompt.x+layout.prompt.width/2,layout.prompt.y+layout.prompt.height/2,state.prompt||state.status||state.phase,base*1.05,'#ffffff',0.5)
    this.text(layout.combat.x+layout.combat.width/2,layout.combat.y+layout.combat.height*0.08,state.timer,base*1.35,state.timer!=='—'&&Number(state.timer)<=10?'#ff6474':'#d7b35a',0.5)
    this.text(layout.deck.x+layout.deck.width/2,layout.deck.y+layout.deck.height*0.86,`DECK ${state.deckCount}`,base*0.72,'#b9c2cf',0.5)
    if(state.connection==='degraded')this.text(layout.width/2,layout.hud.y+layout.hud.height*0.5,'RECONNECTING',base*0.82,'#ffcf66',0.5)
    if(state.result)this.text(layout.width/2,layout.height/2,state.result,base*2.2,'#ffffff',0.5,0.5).setDepth(100)
    void ARENA_THEME
  }
}
