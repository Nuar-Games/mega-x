import Phaser from 'phaser'
import type { ArenaCardRef, ArenaRenderState } from './ArenaStateAdapter'
import type { ArenaDispatch } from './ArenaInput'
import { ARENA_THEME } from './arena-theme'

const ASPECT=59/86

export class ArenaTieBreaker{
  private objects:Phaser.GameObjects.GameObject[]=[]
  constructor(private scene:Phaser.Scene,private dispatch:ArenaDispatch){}
  clear(){this.objects.forEach(obj=>obj.destroy());this.objects=[]}
  private keep<T extends Phaser.GameObjects.GameObject>(obj:T){this.objects.push(obj);return obj}
  private drawCard(card:ArenaCardRef,x:number,y:number,w:number,depth:number,selectable=false){
    const key=`asset:${card.src}`
    if(!this.scene.textures.exists(key))return
    const h=w/ASPECT
    const frame=this.keep(this.scene.add.graphics().setDepth(depth-1))
    const accent=selectable?0xd7b35a:0x758195
    frame.fillStyle(0x02050b,0.94).fillRoundedRect(x-w/2-4,y-h/2-4,w+8,h+8,8)
    frame.lineStyle(selectable?2:1.2,accent,selectable?0.9:0.45).strokeRoundedRect(x-w/2-4,y-h/2-4,w+8,h+8,8)
    const image=this.keep(this.scene.add.image(x,y,key).setDisplaySize(w,h).setDepth(depth))
    if(card.actionId){
      image.setInteractive({useHandCursor:true})
      image.on('pointerover',()=>{image.setY(y-Math.max(10,h*0.045));frame.setAlpha(1)})
      image.on('pointerout',()=>{image.setY(y);frame.setAlpha(0.92)})
      image.on('pointerdown',()=>this.dispatch(card.actionId!))
    }
  }
  render(state:ArenaRenderState){
    this.clear()
    if(state.phase!=='TIE_BREAKER'&&!state.tieBreakerCards.length&&!state.tieBreakerReveal.length)return
    const w=this.scene.scale.width,h=this.scene.scale.height,min=Math.min(w,h)
    this.keep(this.scene.add.rectangle(w/2,h/2,w,h,0x010309,0.88).setDepth(130))
    const glow=this.keep(this.scene.add.graphics().setDepth(131))
    glow.fillStyle(0xd7b35a,0.06).fillCircle(w/2,h*0.46,Math.max(w,h)*0.34)
    glow.lineStyle(Math.max(1,min*0.003),0xd7b35a,0.36).lineBetween(w*0.12,h*0.18,w*0.88,h*0.18)
    glow.lineStyle(Math.max(1,min*0.003),0xd7b35a,0.26).lineBetween(w*0.18,h*0.82,w*0.82,h*0.82)
    this.keep(this.scene.add.text(w/2,h*0.13,'PENENTUAN SERI',{fontFamily:'Oxanium, sans-serif',fontSize:`${Math.max(24,min*0.065)}px`,fontStyle:'bold',color:'#ffffff',stroke:'#03050a',strokeThickness:5,letterSpacing:2.2}).setOrigin(0.5).setDepth(134))
    const msg=state.tieBreakerMessage||'PILIH 1 KAD ANDA'
    this.keep(this.scene.add.text(w/2,h*0.20,msg.toUpperCase(),{fontFamily:'Barlow Condensed, sans-serif',fontSize:`${Math.max(14,min*0.032)}px`,fontStyle:'bold',color:'#e8cf7b',align:'center',wordWrap:{width:w*0.82},letterSpacing:1.1}).setOrigin(0.5).setDepth(134))

    if(state.tieBreakerReveal.length>=2){
      const cw=Math.min(w*0.26,h*0.22*ASPECT)
      this.drawCard(state.tieBreakerReveal[0],w*0.33,h*0.48,cw,138,false)
      this.drawCard(state.tieBreakerReveal[1],w*0.67,h*0.48,cw,138,false)
      this.keep(this.scene.add.text(w/2,h*0.48,'VS',{fontFamily:'Oxanium, sans-serif',fontSize:`${Math.max(28,min*0.08)}px`,fontStyle:'bold',color:'#ffffff',stroke:'#05070c',strokeThickness:6}).setOrigin(0.5).setDepth(140))
    }

    if(state.tieBreakerCards.length){
      const cards=state.tieBreakerCards.slice(0,5)
      const gap=Math.max(4,w*0.012)
      const maxW=(w*0.92-gap*(cards.length-1))/cards.length
      const cw=Math.min(maxW,h*0.28*ASPECT)
      const total=cw*cards.length+gap*(cards.length-1)
      const start=w/2-total/2+cw/2
      const y=state.tieBreakerReveal.length>=2?h*0.75:h*0.55
      cards.forEach((card,i)=>this.drawCard(card,start+i*(cw+gap),y,cw,145+i,Boolean(card.actionId)))
    }

    if(!state.tieBreakerCards.length&&state.tieBreakerReveal.length<2){
      this.keep(this.scene.add.text(w/2,h*0.52,'MENYEDIAKAN KAD PENENTUAN…',{fontFamily:'Oxanium, sans-serif',fontSize:`${Math.max(15,min*0.034)}px`,fontStyle:'bold',color:'#d8dee8',letterSpacing:1.2}).setOrigin(0.5).setDepth(134))
    }
    void ARENA_THEME
  }
}
