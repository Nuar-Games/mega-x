import Phaser from 'phaser'
import type { ArenaLayoutSnapshot, ArenaRect } from './ArenaLayout'
import type { ArenaCardRef, ArenaRenderState } from './ArenaStateAdapter'
import { ARENA_ASSETS } from './ArenaAssets'

const fit=(region:ArenaRect,aspect=59/86,scale=1)=>{
  let height=region.height*scale
  let width=height*aspect
  if(width>region.width*scale){width=region.width*scale;height=width/aspect}
  return {width,height}
}

export class ArenaCards{
  private scene:Phaser.Scene
  private objects:Phaser.GameObjects.GameObject[]=[]
  constructor(scene:Phaser.Scene){this.scene=scene}
  clear(){this.objects.forEach(obj=>obj.destroy());this.objects=[]}
  private image(src:string,region:ArenaRect,scale=1,alpha=1){
    const key=`asset:${src}`
    if(!this.scene.textures.exists(key)) return
    const size=fit(region,59/86,scale)
    const image=this.scene.add.image(region.x+region.width/2,region.y+region.height/2,key).setDisplaySize(size.width,size.height).setAlpha(alpha)
    this.objects.push(image)
    return image
  }
  private card(card:ArenaCardRef|null,region:ArenaRect,scale=1){if(card)this.image(card.src,region,scale)}
  private hand(cards:ArenaCardRef[],region:ArenaRect){
    if(!cards.length)return
    const count=Math.min(cards.length,8)
    const cardW=Math.min(region.width/Math.max(4,count*0.72),region.height*(59/86)*0.92)
    const cardH=cardW/(59/86)
    const total=cardW+(count-1)*cardW*0.62
    const start=region.x+(region.width-total)/2+cardW/2
    cards.slice(-count).forEach((card,index)=>{
      const key=`asset:${card.src}`
      if(!this.scene.textures.exists(key))return
      const image=this.scene.add.image(start+index*cardW*0.62,region.y+region.height*0.56,key).setDisplaySize(cardW,cardH)
      image.setDepth(index+10)
      image.setData('arena-card-src',card.src)
      this.objects.push(image)
    })
  }
  private opponentHand(count:number,region:ArenaRect){
    const key=`asset:${ARENA_ASSETS.cards.backGame}`
    if(!this.scene.textures.exists(key)||count<=0)return
    const visible=Math.min(count,7)
    const cardW=Math.min(region.width/Math.max(4,visible*0.75),region.height*(59/86)*0.82)
    const cardH=cardW/(59/86)
    const total=cardW+(visible-1)*cardW*0.58
    const start=region.x+(region.width-total)/2+cardW/2
    for(let i=0;i<visible;i++){
      const image=this.scene.add.image(start+i*cardW*0.58,region.y+region.height*0.5,key).setDisplaySize(cardW,cardH).setAlpha(0.96)
      this.objects.push(image)
    }
  }
  render(state:ArenaRenderState,layout:ArenaLayoutSnapshot){
    this.clear()
    this.hand(state.localHand,layout.localHand)
    this.opponentHand(state.opponentHandCount,layout.opponentHand)
    this.card(state.localVs,{...layout.combat,x:layout.combat.x,y:layout.combat.y,width:layout.combat.width/2,height:layout.combat.height},0.84)
    this.card(state.opponentVs,{...layout.combat,x:layout.combat.x+layout.combat.width/2,y:layout.combat.y,width:layout.combat.width/2,height:layout.combat.height},0.84)
    this.card(state.localZonX,layout.zonXLeft,0.92)
    this.card(state.opponentZonX,layout.zonXRight,0.92)
    this.card(state.localDiscard,layout.discard,0.9)
    this.card(state.opponentDiscard,layout.deck,0.9)
    if(state.localEffects[0])this.card(state.localEffects[0],layout.effectLeft,0.86)
    if(state.opponentEffects[0])this.card(state.opponentEffects[0],layout.effectRight,0.86)
  }
}
