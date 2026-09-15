import Phaser from 'phaser'
import type { ArenaLayoutSnapshot, ArenaRect } from './ArenaLayout'
import type { ArenaCardRef, ArenaRenderState } from './ArenaStateAdapter'
import type { ArenaDispatch } from './ArenaInput'
import { ARENA_ASSETS } from './ArenaAssets'
import { ARENA_THEME } from './arena-theme'

const CARD_ASPECT=59/86
const fit=(region:ArenaRect,aspect=CARD_ASPECT,scale=1)=>{
  let height=region.height*scale
  let width=height*aspect
  if(width>region.width*scale){width=region.width*scale;height=width/aspect}
  return {width,height}
}

type CardMode='inspect'|'action'

export class ArenaCards{
  private objects:Phaser.GameObjects.GameObject[]=[]
  constructor(private scene:Phaser.Scene,private dispatch:ArenaDispatch,private inspect:(card:ArenaCardRef)=>void){}
  clear(){this.objects.forEach(obj=>obj.destroy());this.objects=[]}
  private keep<T extends Phaser.GameObjects.GameObject>(obj:T){this.objects.push(obj);return obj}
  private image(src:string,region:ArenaRect,scale=1,alpha=1,depth=10){
    const key=`asset:${src}`
    if(!this.scene.textures.exists(key)) return
    const size=fit(region,CARD_ASPECT,scale)
    const image=this.keep(this.scene.add.image(region.x+region.width/2,region.y+region.height/2,key).setDisplaySize(size.width,size.height).setAlpha(alpha).setDepth(depth))
    image.setData('arena-card-src',src)
    return image
  }
  private frame(region:ArenaRect,scale:number,accent:number,depth=8){
    const size=fit(region,CARD_ASPECT,scale)
    const x=region.x+region.width/2-size.width/2
    const y=region.y+region.height/2-size.height/2
    const pad=Math.max(3,size.width*0.035)
    const g=this.keep(this.scene.add.graphics().setDepth(depth))
    g.fillStyle(0x010308,0.78).fillRoundedRect(x-pad,y-pad,size.width+pad*2,size.height+pad*2,Math.max(8,size.width*0.05))
    g.lineStyle(Math.max(2,size.width*0.018),accent,0.78).strokeRoundedRect(x-pad,y-pad,size.width+pad*2,size.height+pad*2,Math.max(8,size.width*0.05))
    g.lineStyle(Math.max(1,size.width*0.008),0xffffff,0.12).strokeRoundedRect(x,y,size.width,size.height,Math.max(6,size.width*0.035))
  }
  private card(card:ArenaCardRef|null,region:ArenaRect,scale=1,accent=0xffffff,depth=10,mode:CardMode='inspect'){
    if(!card)return
    this.frame(region,scale,accent,depth-2)
    const image=this.image(card.src,region,scale,1,depth)
    if(!image)return
    image.setInteractive({useHandCursor:true})
    image.on('pointerover',()=>image.setTint(0xffffff))
    image.on('pointerout',()=>image.clearTint())
    image.on('pointerdown',()=>{
      if(mode==='action'&&card.actionId)this.dispatch(card.actionId)
      else this.inspect(card)
    })
  }
  private hand(cards:ArenaCardRef[],region:ArenaRect){
    if(!cards.length)return
    const count=Math.min(cards.length,8)
    const maxCardH=region.height*0.92
    const maxCardW=maxCardH*CARD_ASPECT
    const step=Math.min(maxCardW*0.62,region.width/Math.max(4,count+1))
    const cardW=Math.min(maxCardW,Math.max(region.width*0.16,step/0.62))
    const cardH=cardW/CARD_ASPECT
    const total=cardW+(count-1)*step
    const start=region.x+(region.width-total)/2+cardW/2
    const center=(count-1)/2
    cards.slice(-count).forEach((card,index)=>{
      const key=`asset:${card.src}`
      if(!this.scene.textures.exists(key))return
      const offset=index-center
      const restY=region.y+region.height*0.57+Math.abs(offset)*Math.min(3,region.height*0.012)
      const angle=Phaser.Math.Clamp(offset*2.1,-7,7)
      this.keep(this.scene.add.rectangle(start+index*step+3,restY+5,cardW+5,cardH+7,0x000000,0.42).setDepth(18+index).setAngle(angle))
      const image=this.keep(this.scene.add.image(start+index*step,restY,key).setDisplaySize(cardW,cardH).setDepth(20+index).setAngle(angle))
      image.setData('arena-card-src',card.src)
      image.setInteractive({useHandCursor:true})
      image.on('pointerover',()=>{image.setY(restY-Math.max(14,region.height*0.08));image.setAngle(0);image.setDepth(80)})
      image.on('pointerout',()=>{image.setY(restY);image.setAngle(angle);image.setDepth(20+index)})
      image.on('pointerdown',()=>card.actionId?this.dispatch(card.actionId):this.inspect(card))
    })
  }
  private opponentHand(count:number,region:ArenaRect){
    const key=`asset:${ARENA_ASSETS.cards.backGame}`
    if(!this.scene.textures.exists(key)||count<=0)return
    const visible=Math.min(count,7)
    const maxCardH=region.height*0.86
    const maxCardW=maxCardH*CARD_ASPECT
    const step=Math.min(maxCardW*0.52,region.width/Math.max(5,visible+1))
    const cardW=Math.min(maxCardW,Math.max(region.width*0.11,step/0.52))
    const cardH=cardW/CARD_ASPECT
    const total=cardW+(visible-1)*step
    const start=region.x+(region.width-total)/2+cardW/2
    const center=(visible-1)/2
    for(let i=0;i<visible;i++){
      const offset=i-center
      const image=this.keep(this.scene.add.image(start+i*step,region.y+region.height*0.50,key).setDisplaySize(cardW,cardH).setAlpha(0.98).setDepth(12+i).setAngle(offset*1.5))
      image.setData('arena-card-back',true)
    }
  }
  private effects(cards:ArenaCardRef[],region:ArenaRect,accent:number){
    if(!cards.length)return
    const visible=cards.slice(0,5)
    const slotH=region.height/Math.max(3,visible.length)
    visible.forEach((card,index)=>{
      const slot:ArenaRect={x:region.x,y:region.y+index*slotH,width:region.width,height:slotH}
      this.card(card,slot,0.72,accent,30+index,'inspect')
    })
  }
  render(state:ArenaRenderState,layout:ArenaLayoutSnapshot){
    this.clear()
    this.hand(state.localHand,layout.localHand)
    this.opponentHand(state.opponentHandCount,layout.opponentHand)
    const half=layout.combat.width/2
    const localRegion={...layout.combat,x:layout.combat.x,y:layout.combat.y,width:half,height:layout.combat.height}
    const opponentRegion={...layout.combat,x:layout.combat.x+half,y:layout.combat.y,width:half,height:layout.combat.height}
    this.card(state.localVs,localRegion,layout.mode==='portrait'?0.93:0.88,ARENA_THEME.colors.player,42,'inspect')
    this.card(state.opponentVs,opponentRegion,layout.mode==='portrait'?0.93:0.88,ARENA_THEME.colors.opponent,42,'inspect')
    this.card(state.localZonX,layout.zonXLeft,0.9,ARENA_THEME.colors.player,24,'inspect')
    this.card(state.opponentZonX,layout.zonXRight,0.9,ARENA_THEME.colors.opponent,24,'inspect')
    this.card(state.localDiscard,layout.discard,0.82,0x8b93a1,22,'inspect')
    this.card(state.opponentDiscard,layout.deck,0.82,0x8b93a1,22,'inspect')
    this.effects(state.localEffects,layout.effectLeft,ARENA_THEME.colors.player)
    this.effects(state.opponentEffects,layout.effectRight,ARENA_THEME.colors.opponent)
  }
}
