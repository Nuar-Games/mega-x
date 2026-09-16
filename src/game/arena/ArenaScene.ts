import Phaser from 'phaser'
import { ARENA_ASSETS } from './ArenaAssets'
import { computeArenaLayout, type ArenaLayoutSnapshot, type ArenaRect } from './ArenaLayout'
import { readArenaRenderState, type ArenaRenderState } from './ArenaStateAdapter'
import { ArenaCards } from './ArenaCards'
import { ArenaHud } from './ArenaHud'
import { ArenaEffects } from './ArenaEffects'
import { ArenaInput, createDomArenaDispatch } from './ArenaInput'
import { ArenaAudio } from './ArenaAudio'
import { ArenaInspect } from './ArenaInspect'
import { ArenaTexturePool } from './ArenaTexturePool'
import { ArenaTieBreaker } from './ArenaTieBreaker'
import { ARENA_THEME } from './arena-theme'

export class ArenaScene extends Phaser.Scene{
  private shell:HTMLElement
  private cards!:ArenaCards
  private hud!:ArenaHud
  private effects!:ArenaEffects
  private inputLayer!:ArenaInput
  private inspectLayer!:ArenaInspect
  private tieBreaker!:ArenaTieBreaker
  private texturePool!:ArenaTexturePool
  private audioLayer=new ArenaAudio()
  private previous:ArenaRenderState|null=null
  private layout!:ArenaLayoutSnapshot
  private backdrop?:Phaser.GameObjects.Image
  private ambience:Phaser.GameObjects.GameObject[]=[]
  constructor(shell:HTMLElement){super('MegaXCleanArena');this.shell=shell}

  preload(){
    this.texturePool=new ArenaTexturePool(this,()=>this.renderArena())
    this.load.image(`asset:${ARENA_ASSETS.background}`,ARENA_ASSETS.background)
    this.load.image(`asset:${ARENA_ASSETS.logo}`,ARENA_ASSETS.logo)
    this.load.image(`asset:${ARENA_ASSETS.vs.mark}`,ARENA_ASSETS.vs.mark)
    this.load.image(`asset:${ARENA_ASSETS.vs.player}`,ARENA_ASSETS.vs.player)
    this.load.image(`asset:${ARENA_ASSETS.vs.opponent}`,ARENA_ASSETS.vs.opponent)
    this.load.image(`asset:${ARENA_ASSETS.cards.backGame}`,ARENA_ASSETS.cards.backGame)
    Object.values(ARENA_ASSETS.arenaUi).forEach(src=>this.load.image(`asset:${src}`,src))
    this.texturePool.preloadState(readArenaRenderState(this.shell))
  }

  create(){
    const dispatch=createDomArenaDispatch(this.shell)
    this.inspectLayer=new ArenaInspect(this)
    this.cards=new ArenaCards(this,dispatch,card=>this.inspectLayer.show(card))
    this.hud=new ArenaHud(this)
    this.effects=new ArenaEffects(this)
    this.inputLayer=new ArenaInput(this,dispatch)
    this.tieBreaker=new ArenaTieBreaker(this,dispatch)
    this.scale.on('resize',()=>{this.inspectLayer.close();this.renderArena(true)})
    this.renderArena(true)
    this.shell.dispatchEvent(new Event('mega-x:arena-ready'))
  }

  private keep<T extends Phaser.GameObjects.GameObject>(obj:T){this.ambience.push(obj);return obj}
  private asset(src:string,region:ArenaRect,alpha:number,depth=-8,flip=false){
    const key=`asset:${src}`
    if(!this.textures.exists(key))return
    const img=this.keep(this.add.image(region.x+region.width/2,region.y+region.height/2,key).setDisplaySize(region.width,region.height).setAlpha(alpha).setDepth(depth))
    if(flip)img.setFlipX(true)
    return img
  }

  private drawArenaFrame(state:ArenaRenderState){
    this.ambience.forEach(obj=>obj.destroy());this.ambience=[];this.backdrop?.destroy()
    const w=this.scale.width,h=this.scale.height,min=Math.min(w,h)
    if(this.textures.exists(`asset:${ARENA_ASSETS.background}`))this.backdrop=this.add.image(w/2,h/2,`asset:${ARENA_ASSETS.background}`).setDisplaySize(w,h).setAlpha(0.72).setDepth(-40)

    const wash=this.keep(this.add.graphics().setDepth(-35))
    wash.fillStyle(0x01040a,0.28).fillRect(0,0,w,h)
    wash.fillStyle(ARENA_THEME.colors.player,0.11).fillCircle(w*0.12,h*0.70,Math.max(w,h)*0.42)
    wash.fillStyle(ARENA_THEME.colors.opponent,0.10).fillCircle(w*0.88,h*0.24,Math.max(w,h)*0.42)
    if(this.layout.mode==='wide'){
      wash.fillStyle(0x02101a,0.28).fillRect(0,0,w*0.48,h)
      wash.fillStyle(0x1a0308,0.20).fillRect(w*0.52,0,w*0.48,h)
    }

    const combat=this.layout.combat
    const cx=combat.x+combat.width/2,cy=combat.y+combat.height/2
    const stage=this.keep(this.add.graphics().setDepth(-20))
    stage.fillStyle(0x000000,0.20).fillEllipse(cx,cy,combat.width*0.98,combat.height*0.90)
    stage.lineStyle(Math.max(2,min*0.003),0xb7eaff,0.14).strokeEllipse(cx,cy,combat.width*0.95,combat.height*0.86)
    stage.lineStyle(Math.max(5,min*0.004),ARENA_THEME.colors.player,0.62).lineBetween(combat.x+combat.width*0.02,cy,combat.x+combat.width*0.40,cy)
    stage.lineStyle(Math.max(5,min*0.004),ARENA_THEME.colors.opponent,0.62).lineBetween(combat.x+combat.width*0.60,cy,combat.x+combat.width*0.98,cy)
    stage.lineStyle(Math.max(2,min*0.002),0xd6b452,0.22).strokeRoundedRect(combat.x+combat.width*0.08,combat.y+combat.height*0.11,combat.width*0.84,combat.height*0.73,18)

    const fieldSlots=5
    const slotGap=Math.max(10,Math.min(20,combat.width*0.014))
    const slotH=Math.min(combat.height*0.53,270)
    const slotW=slotH*(59/86)
    const totalSlots=fieldSlots*slotW+(fieldSlots-1)*slotGap
    const slotStart=cx-totalSlots/2
    const slotY=cy-slotH*0.42
    for(let i=0;i<fieldSlots;i++){
      const src=i===0?ARENA_ASSETS.arenaUi.fieldBlue:i===fieldSlots-1?ARENA_ASSETS.arenaUi.fieldRed:ARENA_ASSETS.arenaUi.fieldNeutral
      const alpha=i===0||i===fieldSlots-1?0.82:0.58
      this.asset(src,{x:slotStart+i*(slotW+slotGap),y:slotY,width:slotW,height:slotH},alpha,-18)
    }

    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.mark}`)){
      const mark=Math.min(combat.width*0.14,combat.height*0.22,132)
      this.keep(this.add.image(cx,cy-slotH*0.60,`asset:${ARENA_ASSETS.vs.mark}`).setDisplaySize(mark,mark).setAlpha(0.96).setDepth(-4))
    }

    if(this.layout.mode==='wide'){
      const rail=this.keep(this.add.graphics().setDepth(-13))
      const leftX=this.layout.effectLeft.x-6,rightX=this.layout.effectRight.x-6
      const railW=this.layout.effectLeft.width+12,railY=this.layout.effectLeft.y-12
      const railH=(this.layout.discard.y+this.layout.discard.height)-railY+10
      rail.fillStyle(0x02070b,0.66).fillRoundedRect(leftX,railY,railW,railH,12)
      rail.lineStyle(2,ARENA_THEME.colors.player,0.38).strokeRoundedRect(leftX,railY,railW,railH,12)
      rail.fillStyle(0x0b0204,0.66).fillRoundedRect(rightX,railY,railW,railH,12)
      rail.lineStyle(2,ARENA_THEME.colors.opponent,0.38).strokeRoundedRect(rightX,railY,railW,railH,12)
    }

    this.asset(ARENA_ASSETS.arenaUi.fieldNeutral,this.layout.effectLeft,state.localEffects.length?0.82:0.48,-7)
    this.asset(ARENA_ASSETS.arenaUi.fieldNeutral,this.layout.effectRight,state.opponentEffects.length?0.82:0.48,-7,true)
    this.asset(ARENA_ASSETS.arenaUi.zonXFixture,this.layout.zonXLeft,state.localZonX?0.96:0.72,-7)
    this.asset(ARENA_ASSETS.arenaUi.zonXFixture,this.layout.zonXRight,state.opponentZonX?0.96:0.72,-7,true)
    this.asset(ARENA_ASSETS.arenaUi.discardFixture,this.layout.discard,state.localDiscard?0.94:0.76,-8)
    this.asset(ARENA_ASSETS.arenaUi.deckFixture,this.layout.deck,0.98,-8,true)
  }

  public renderArena(force=false){
    if(!this.cards)return
    this.layout=computeArenaLayout(this.scale.width,this.scale.height)
    const next=readArenaRenderState(this.shell)
    this.texturePool.ensureState(next)
    if(force||!this.previous||this.previous.localEffects.length!==next.localEffects.length||this.previous.opponentEffects.length!==next.opponentEffects.length||this.previous.localZonX?.src!==next.localZonX?.src||this.previous.opponentZonX?.src!==next.opponentZonX?.src||this.previous.localDiscard?.src!==next.localDiscard?.src||this.previous.opponentDiscard?.src!==next.opponentDiscard?.src)this.drawArenaFrame(next)
    this.cards.render(next,this.layout)
    this.hud.render(next,this.layout)
    this.inputLayer.render(next,this.layout)
    this.tieBreaker.render(next)
    this.effects.transition(this.previous,next)
    this.audioLayer.sync(next)
    this.previous=next
  }
}
