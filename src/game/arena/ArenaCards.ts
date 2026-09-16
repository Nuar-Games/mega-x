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
  private shadow(region:ArenaRect,scale:number,depth:number,alpha=0.42){
    const size=fit(region,CARD_ASPECT,scale)
    return this.keep(this.scene.add.ellipse(region.x+region.width/2+size.width*0.035,region.y+region.height/2+size.height*0.035,size.width*0.92,size.height*0.92,0x000000,alpha).setDepth(depth))
  }
  private focus(region:ArenaRect,scale:number,accent:number,depth:number){
    const size=fit(region,CARD_ASPECT,scale)
    const x=region.x+region.width/2,y=region.y+region.height/2
    const g=this.keep(this.scene.add.graphics().setDepth(depth))
    g.lineStyle(Math.max(2,size.width*0.026),accent,0.68).strokeEllipse(x,y,size.width*1.13,size.height*1.06)
    g.lineStyle(Math.max(1,size.width*0.012),0xffffff,0.16).strokeEllipse(x,y,size.width*1.03,size.height*0.98)
  }
  private card(card:ArenaCardRef|null,region:ArenaRect,scale=1,accent=0xffffff,depth=10,mode:CardMode='inspect',featured=false,alpha=1){
    if(!card)return
    this.shadow(region,scale,depth-3,featured?0.52:0.30)
    if(featured)this.focus(region,scale,accent,depth-2)
    const image=this.image(card.src,region,scale,alpha,depth)
    if(!image)return
    image.setInteractive({useHandCursor:true})
    image.on('pointerover',()=>{image.setScale(1.035);image.setDepth(depth+30)})
    image.on('pointerout',()=>{image.setScale(1);image.setDepth(depth)})
    image.on('pointerdown',()=>{
      if(mode==='action'&&card.actionId)this.dispatch(card.actionId)
      else this.inspect(card)
    })
  }
  private hand(cards:ArenaCardRef[],region:ArenaRect){
    if(!cards.length)return
    const count=Math.min(cards.length,8)
    const maxCardH=region.height*0.98
    const maxCardW=maxCardH*CARD_ASPECT
    const step=Math.min(maxCardW*0.66,region.width/Math.max(4,count+0.5))
    const cardW=Math.min(maxCardW,Math.max(region.width*0.17,step/0.66))
    const cardH=cardW/CARD_ASPECT
    const total=cardW+(count-1)*step
    const start=region.x+(region.width-total)/2+cardW/2
    const center=(count-1)/2
    cards.slice(-count).forEach((card,index)=>{
      const key=`asset:${card.src}`
      if(!this.scene.textures.exists(key))return
      const offset=index-center
      const restY=region.y+region.height*0.55+Math.abs(offset)*Math.min(3,region.height*0.012)
      const angle=Phaser.Math.Clamp(offset*1.8,-6,6)
      this.keep(this.scene.add.ellipse(start+index*step+3,restY+cardH*0.08,cardW*0.86,cardH*0.88,0x000000,0.42).setDepth(18+index).setAngle(angle))
      const image=this.keep(this.scene.add.image(start+index*step,restY,key).setDisplaySize(cardW,cardH).setDepth(20+index).setAngle(angle))
      image.setData('arena-card-src',card.src)
      image.setInteractive({useHandCursor:true})
      image.on('pointerover',()=>{image.setY(restY-Math.max(16,region.height*0.09));image.setAngle(0);image.setDepth(80);image.setScale(1.04)})
      image.on('pointerout',()=>{image.setY(restY);image.setAngle(angle);image.setDepth(20+index);image.setScale(1)})
      image.on('pointerdown',()=>{
        if(card.actions?.length){this.inspect(card);return}
        if(card.actionId){this.dispatch(card.actionId);return}
        this.inspect(card)
      })
    })
  }
  private opponentHand(count:number,region:ArenaRect){
    const key=`asset:${ARENA_ASSETS.cards.backGame}`
    if(!this.scene.textures.exists(key)||count<=0)return
    const visible=Math.min(count,7)
    const maxCardH=region.height*0.92
    const maxCardW=maxCardH*CARD_ASPECT
    const step=Math.min(maxCardW*0.57,region.width/Math.max(5,visible+1))
    const cardW=Math.min(maxCardW,Math.max(region.width*0.12,step/0.57))
    const cardH=cardW/CARD_ASPECT
    const total=cardW+(visible-1)*step
    const start=region.x+(region.width-total)/2+cardW/2
    const center=(visible-1)/2
    for(let i=0;i<visible;i++){
      const offset=i-center
      const image=this.keep(this.scene.add.image(start+i*step,region.y+region.height*0.51,key).setDisplaySize(cardW,cardH).setAlpha(0.90).setDepth(12+i).setAngle(offset*1.35))
      image.setData('arena-card-back',true)
    }
  }
  private effects(cards:ArenaCardRef[],region:ArenaRect,accent:number){
    if(!cards.length)return
    const visible=cards.slice(0,4)
    const slotH=region.height/Math.max(3,visible.length)
    visible.forEach((card,index)=>{
      const slot:ArenaRect={x:region.x,y:region.y+index*slotH,width:region.width,height:slotH}
      this.card(card,slot,0.74,accent,30+index,'inspect',false,0.82)
    })
  }
  render(state:ArenaRenderState,layout:ArenaLayoutSnapshot){
    this.clear()
    this.hand(state.localHand,layout.localHand)
    this.opponentHand(state.opponentHandCount,layout.opponentHand)

    const vsCardH=Math.min(layout.combat.height*0.68,310)
    const vsCardW=vsCardH*CARD_ASPECT
    const vsGap=Math.max(28,layout.combat.width*0.055)
    const vsY=layout.combat.y+layout.combat.height*0.52-vsCardH/2
    const centerX=layout.combat.x+layout.combat.width/2
    const localRegion:ArenaRect={x:centerX-vsGap-vsCardW,y:vsY,width:vsCardW,height:vsCardH}
    const opponentRegion:ArenaRect={x:centerX+vsGap,y:vsY,width:vsCardW,height:vsCardH}
    this.card(state.localVs,localRegion,0.96,ARENA_THEME.colors.player,42,'inspect',true,1)
    this.card(state.opponentVs,opponentRegion,0.96,ARENA_THEME.colors.opponent,42,'inspect',true,1)

    this.card(state.localZonX,layout.zonXLeft,0.88,ARENA_THEME.colors.player,24,'inspect',false,0.84)
    this.card(state.opponentZonX,layout.zonXRight,0.88,ARENA_THEME.colors.opponent,24,'inspect',false,0.84)
    this.card(state.localDiscard,layout.discard,0.76,0x8b93a1,22,'inspect',false,0.66)
    this.card(state.opponentDiscard,layout.deck,0.76,0x8b93a1,22,'inspect',false,0.66)
    this.effects(state.localEffects,layout.effectLeft,ARENA_THEME.colors.player)
    this.effects(state.opponentEffects,layout.effectRight,ARENA_THEME.colors.opponent)
  }
}
