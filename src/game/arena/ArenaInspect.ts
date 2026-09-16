import Phaser from 'phaser'
import type { ArenaCardAction, ArenaCardRef } from './ArenaStateAdapter'
import { ARENA_ASSETS } from './ArenaAssets'

const inspectSource=(src:string)=>{
  const match=src.match(/\/cards\/(?:game|inspect)\/(\d{2})\.webp$/)
  return match?`/cards/inspect/${match[1]}.webp`:src
}

export class ArenaInspect{
  private objects:Phaser.GameObjects.GameObject[]=[]
  private loading:string|null=null
  constructor(private scene:Phaser.Scene){}

  close(){
    this.objects.forEach(obj=>obj.destroy())
    this.objects=[]
    this.scene.game.canvas.removeAttribute('data-arena-choice')
    this.scene.game.canvas.removeAttribute('data-arena-choice-actions')
  }

  show(card:ArenaCardRef,onAction?:(action:ArenaCardAction)=>void){
    const src=inspectSource(card.src)
    const key=`inspect:${src}`
    if(this.scene.textures.exists(key)){this.render(key,card,onAction);return}
    if(this.loading===src)return
    this.loading=src
    this.scene.load.image(key,src)
    this.scene.load.once(Phaser.Loader.Events.COMPLETE,()=>{
      this.loading=null
      if(this.scene.textures.exists(key))this.render(key,card,onAction)
    })
    this.scene.load.once('loaderror',()=>{
      this.loading=null
      const fallback=`asset:${card.src}`
      if(this.scene.textures.exists(fallback))this.render(fallback,card,onAction)
    })
    this.scene.load.start()
  }

  private render(key:string,card:ArenaCardRef,onAction?:(action:ArenaCardAction)=>void){
    this.close()
    const w=this.scene.scale.width
    const h=this.scene.scale.height
    const hasActions=Boolean(card.actions?.length&&onAction)
    this.scene.game.canvas.dataset.arenaChoice=hasActions?'open':'inspect'
    const dim=this.scene.add.rectangle(w/2,h/2,w,h,0x010207,0.90).setDepth(200).setInteractive()
    dim.on('pointerdown',()=>this.close())
    this.objects.push(dim)

    const wide=w>=720
    const maxH=h*(hasActions?0.66:0.76)
    const maxW=w*(hasActions&&wide?0.46:0.74)
    const aspect=59/86
    let cardH=maxH
    let cardW=cardH*aspect
    if(cardW>maxW){cardW=maxW;cardH=cardW/aspect}
    const cardX=hasActions&&wide?w*0.43:w/2
    const cardY=h/2
    const frameKey=`asset:${ARENA_ASSETS.arenaUi.inspectFrame}`
    if(this.scene.textures.exists(frameKey)){
      const fw=cardW*1.18,fh=cardH*1.13
      this.objects.push(this.scene.add.image(cardX,cardY,frameKey).setDisplaySize(fw,fh).setDepth(201).setAlpha(0.96))
    }
    this.objects.push(this.scene.add.ellipse(cardX+8,cardY+14,cardW*0.94,cardH*0.94,0x000000,0.58).setDepth(201))
    const image=this.scene.add.image(cardX,cardY,key).setDisplaySize(cardW,cardH).setDepth(202)
    const title=this.scene.add.text(cardX,Math.max(22,cardY-cardH/2-30),(card.alt||'CARD').toUpperCase(),{fontFamily:'Oxanium, sans-serif',fontSize:`${Math.max(14,Math.min(24,w*0.04))}px`,fontStyle:'bold',color:'#ffffff',stroke:'#02040a',strokeThickness:3,letterSpacing:1.2}).setOrigin(0.5).setDepth(203)
    this.objects.push(image,title)

    if(hasActions&&card.actions&&onAction){
      const actions=card.actions.slice(0,3)
      const actionX=wide?w*0.71:w/2
      const baseY=wide?h*0.43:Math.min(h-116,cardY+cardH/2+44)
      const gap=wide?70:54
      const actionCenters=actions.map((_,index)=>({x:actionX,y:baseY+(index-(actions.length-1)/2)*gap}))
      this.scene.game.canvas.dataset.arenaChoiceActions=JSON.stringify(actionCenters)
      actions.forEach((action,index)=>{
        const {x,y}=actionCenters[index]
        const isAttack=/ATK|ATTACK|SERANG/i.test(action.label)
        const isEffect=/EFFECT/i.test(action.label)
        const src=isAttack?ARENA_ASSETS.arenaUi.commandAttack:isEffect?ARENA_ASSETS.arenaUi.commandSkill:ARENA_ASSETS.arenaUi.commandMove
        const assetKey=`asset:${src}`
        const width=Math.min(wide?250:w*0.72,300)
        const height=Math.max(48,Math.min(66,h*0.075))
        const hitHeight=Math.max(height,wide?64:52)
        const hit=this.scene.add.rectangle(x,y,width,hitHeight,0x000000,0.001).setDepth(203.5).setInteractive({useHandCursor:true})
        hit.on('pointerdown',()=>{this.close();onAction(action)})
        this.objects.push(hit)
        let control:Phaser.GameObjects.GameObject
        if(this.scene.textures.exists(assetKey)){
          const button=this.scene.add.image(x,y,assetKey).setDisplaySize(width,height).setDepth(204).setInteractive({useHandCursor:true})
          button.on('pointerdown',()=>{this.close();onAction(action)})
          control=button
        }else{
          const button=this.scene.add.text(x,y,action.label,{fontFamily:'Oxanium, sans-serif',fontSize:'18px',fontStyle:'bold',color:'#f5e5a4',backgroundColor:'#11151d',padding:{x:18,y:12}}).setOrigin(0.5).setDepth(204).setInteractive({useHandCursor:true})
          button.on('pointerdown',()=>{this.close();onAction(action)})
          control=button
        }
        this.objects.push(control)
        const label=this.scene.add.text(x,y,action.label.replace(/^SET VS · /i,''),{fontFamily:'Oxanium, sans-serif',fontSize:`${Math.max(13,Math.min(18,w*0.023))}px`,fontStyle:'bold',color:'#fff8d8',stroke:'#080b10',strokeThickness:3,letterSpacing:1}).setOrigin(0.5).setDepth(205).setInteractive({useHandCursor:true})
        label.on('pointerdown',()=>{this.close();onAction(action)})
        this.objects.push(label)
      })
      const instruction=this.scene.add.text(actionX,wide?baseY-gap*1.15:Math.max(18,baseY-gap*1.45),'CHOOSE POSITION',{fontFamily:'Barlow Condensed, sans-serif',fontSize:`${Math.max(12,Math.min(18,w*0.025))}px`,fontStyle:'bold',color:'#d9c16d',letterSpacing:1.8}).setOrigin(0.5).setDepth(205)
      this.objects.push(instruction)
    }else{
      const close=this.scene.add.text(w/2,h/2+cardH/2+32,'TAP ANYWHERE TO CLOSE',{fontFamily:'Barlow Condensed, sans-serif',fontSize:`${Math.max(12,Math.min(20,w*0.032))}px`,fontStyle:'bold',color:'#c9d1dc',letterSpacing:1.4}).setOrigin(0.5).setDepth(203)
      this.objects.push(close)
    }
  }
}
