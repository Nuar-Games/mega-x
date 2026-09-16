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
    if(this.textures.exists(`asset:${ARENA_ASSETS.background}`))this.backdrop=this.add.image(w/2,h/2,`asset:${ARENA_ASSETS.background}`).setDisplaySize(w,h).setAlpha(0.64).setDepth(-40)

    const wash=this.keep(this.add.graphics().setDepth(-35))
    wash.fillStyle(0x01040a,0.40).fillRect(0,0,w,h)
    wash.fillStyle(ARENA_THEME.colors.player,0.095).fillCircle(w*0.18,h*0.73,Math.max(w,h)*0.42)
    wash.fillStyle(ARENA_THEME.colors.opponent,0.09).fillCircle(w*0.82,h*0.24,Math.max(w,h)*0.42)

    const combat=this.layout.combat
    const cx=combat.x+combat.width/2,cy=combat.y+combat.height/2
    const zoneGap=Math.max(12,combat.width*0.025)
    const zoneW=Math.max(120,(combat.width-zoneGap*3)/2)
    const zoneH=Math.max(180,combat.height*0.78)
    const zoneY=cy-zoneH/2
    this.asset(ARENA_ASSETS.arenaUi.fieldBlue,{x:combat.x+zoneGap,y:zoneY,width:zoneW,height:zoneH},0.78,-18)
    this.asset(ARENA_ASSETS.arenaUi.fieldRed,{x:combat.x+combat.width-zoneGap-zoneW,y:zoneY,width:zoneW,height:zoneH},0.78,-18)

    const stage=this.keep(this.add.graphics().setDepth(-16))
    stage.fillStyle(0x000000,0.22).fillEllipse(cx,cy,combat.width*0.93,combat.height*0.86)
    stage.lineStyle(Math.max(2,min*0.0035),0xffffff,0.12).strokeEllipse(cx,cy,combat.width*0.90,combat.height*0.80)
    stage.lineStyle(Math.max(3,min*0.004),ARENA_THEME.colors.player,0.62).lineBetween(combat.x+combat.width*0.08,cy,combat.x+combat.width*0.41,cy)
    stage.lineStyle(Math.max(3,min*0.004),ARENA_THEME.colors.opponent,0.62).lineBetween(combat.x+combat.width*0.59,cy,combat.x+combat.width*0.92,cy)

    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.player}`))this.keep(this.add.image(combat.x,cy,`asset:${ARENA_ASSETS.vs.player}`).setOrigin(0,0.5).setDisplaySize(Math.min(w*0.28,430),combat.height*0.83).setAlpha(0.14).setDepth(-25))
    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.opponent}`))this.keep(this.add.image(combat.x+combat.width,cy,`asset:${ARENA_ASSETS.vs.opponent}`).setOrigin(1,0.5).setDisplaySize(Math.min(w*0.28,430),combat.height*0.83).setAlpha(0.14).setDepth(-25))
    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.mark}`)){
      const mark=Math.min(combat.width*0.12,combat.height*0.16,108)
      this.keep(this.add.image(cx,cy,`asset:${ARENA_ASSETS.vs.mark}`).setDisplaySize(mark,mark).setAlpha(0.92).setDepth(-4))
    }

    this.asset(ARENA_ASSETS.arenaUi.fieldNeutral,this.layout.effectLeft,state.localEffects.length?0.72:0.40,-7)
    this.asset(ARENA_ASSETS.arenaUi.fieldNeutral,this.layout.effectRight,state.opponentEffects.length?0.72:0.40,-7,true)
    this.asset(ARENA_ASSETS.arenaUi.zonXFixture,this.layout.zonXLeft,state.localZonX?0.92:0.64,-7)
    this.asset(ARENA_ASSETS.arenaUi.zonXFixture,this.layout.zonXRight,state.opponentZonX?0.92:0.64,-7,true)
    this.asset(ARENA_ASSETS.arenaUi.discardFixture,this.layout.discard,state.localDiscard?0.88:0.66,-8)
    this.asset(ARENA_ASSETS.arenaUi.deckFixture,this.layout.deck,0.92,-8,true)
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
