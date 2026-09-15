import Phaser from 'phaser'
import type { ArenaCardRef } from './ArenaStateAdapter'
import { ARENA_ASSETS } from './ArenaAssets'

const inspectSource=(src:string)=>{
  const match=src.match(/\/cards\/(?:game|inspect)\/(\d{2})\.webp$/)
  return match?`/cards/inspect/${match[1]}.webp`:src
}

export class ArenaInspect{
  private objects:Phaser.GameObjects.GameObject[]=[]
  private loading:string|null=null
  constructor(private scene:Phaser.Scene){}

  close(){this.objects.forEach(obj=>obj.destroy());this.objects=[]}

  show(card:ArenaCardRef){
    const src=inspectSource(card.src)
    const key=`inspect:${src}`
    if(this.scene.textures.exists(key)){this.render(key,card.alt);return}
    if(this.loading===src)return
    this.loading=src
    this.scene.load.image(key,src)
    this.scene.load.once(Phaser.Loader.Events.COMPLETE,()=>{
      this.loading=null
      if(this.scene.textures.exists(key))this.render(key,card.alt)
    })
    this.scene.load.once(Phaser.Loader.Events.LOAD_ERROR,()=>{this.loading=null;this.render(`asset:${card.src}`,card.alt)})
    this.scene.load.start()
  }

  private render(key:string,label:string){
    this.close()
    const w=this.scene.scale.width
    const h=this.scene.scale.height
    const dim=this.scene.add.rectangle(w/2,h/2,w,h,0x010207,0.92).setDepth(200).setInteractive()
    dim.on('pointerdown',()=>this.close())
    this.objects.push(dim)

    const maxH=h*0.78
    const maxW=w*0.78
    const aspect=59/86
    let cardH=maxH
    let cardW=cardH*aspect
    if(cardW>maxW){cardW=maxW;cardH=cardW/aspect}
    const shadow=this.scene.add.rectangle(w/2+8,h/2+12,cardW+18,cardH+18,0x000000,0.62).setDepth(201)
    const image=this.scene.add.image(w/2,h/2,key).setDisplaySize(cardW,cardH).setDepth(202)
    const title=this.scene.add.text(w/2,h/2-cardH/2-24,(label||'CARD').toUpperCase(),{fontFamily:'Oxanium, sans-serif',fontSize:`${Math.max(14,Math.min(24,w*0.04))}px`,fontStyle:'bold',color:'#ffffff',stroke:'#02040a',strokeThickness:3,letterSpacing:1.2}).setOrigin(0.5).setDepth(203)
    const close=this.scene.add.text(w/2,h/2+cardH/2+28,'TAP ANYWHERE TO CLOSE',{fontFamily:'Barlow Condensed, sans-serif',fontSize:`${Math.max(12,Math.min(20,w*0.032))}px`,fontStyle:'bold',color:'#c9d1dc',letterSpacing:1.4}).setOrigin(0.5).setDepth(203)
    this.objects.push(shadow,image,title,close)
  }
}

void ARENA_ASSETS
