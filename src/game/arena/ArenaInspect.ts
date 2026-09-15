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
    this.scene.load.once('loaderror',()=>{
      this.loading=null
      const fallback=`asset:${card.src}`
      if(this.scene.textures.exists(fallback))this.render(fallback,card.alt)
    })
    this.scene.load.start()
  }

  private render(key:string,label:string){
    this.close()
    const w=this.scene.scale.width
    const h=this.scene.scale.height
    const dim=this.scene.add.rectangle(w/2,h/2,w,h,0x010207,0.92).setDepth(200).setInteractive()
    dim.on('pointerdown',()=>this.close())
    this.objects.push(dim)

    const maxH=h*0.76
    const maxW=w*0.74
    const aspect=59/86
    let cardH=maxH
    let cardW=cardH*aspect
    if(cardW>maxW){cardW=maxW;cardH=cardW/aspect}
    const frameKey=`asset:${ARENA_ASSETS.arenaUi.inspectFrame}`
    if(this.scene.textures.exists(frameKey)){
      const fw=cardW*1.18,fh=cardH*1.13
      this.objects.push(this.scene.add.image(w/2,h/2,frameKey).setDisplaySize(fw,fh).setDepth(201).setAlpha(0.96))
    }
    this.objects.push(this.scene.add.ellipse(w/2+8,h/2+14,cardW*0.94,cardH*0.94,0x000000,0.58).setDepth(201))
    const image=this.scene.add.image(w/2,h/2,key).setDisplaySize(cardW,cardH).setDepth(202)
    const title=this.scene.add.text(w/2,h/2-cardH/2-30,(label||'CARD').toUpperCase(),{fontFamily:'Oxanium, sans-serif',fontSize:`${Math.max(14,Math.min(24,w*0.04))}px`,fontStyle:'bold',color:'#ffffff',stroke:'#02040a',strokeThickness:3,letterSpacing:1.2}).setOrigin(0.5).setDepth(203)
    const close=this.scene.add.text(w/2,h/2+cardH/2+32,'TAP ANYWHERE TO CLOSE',{fontFamily:'Barlow Condensed, sans-serif',fontSize:`${Math.max(12,Math.min(20,w*0.032))}px`,fontStyle:'bold',color:'#c9d1dc',letterSpacing:1.4}).setOrigin(0.5).setDepth(203)
    this.objects.push(image,title,close)
  }
}
