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
    if(this.textures.exists(`asset:${ARENA_ASSETS.background}`))this.backdrop=this.add.image(w/2,h/2,`asset:${ARENA_ASSETS.background}`).setDisplaySize(w,h).setAlpha(0.50).setDepth(-40)

    const wash=this.keep(this.add.graphics().setDepth(-35))
    wash.fillStyle(0x01040a,0.73).fillRect(0,0,w,h)
    wash.fillStyle(ARENA_THEME.colors.player,0.055).fillCircle(w*0.22,h*0.77,Math.max(w,h)*0.48)
    wash.fillStyle(ARENA_THEME.colors.opponent,0.05).fillCircle(w*0.80,h*0.25,Math.max(w,h)*0.45)

    const combat=this.layout.combat
    const stage=this.keep(this.add.graphics().setDepth(-20))
    const cx=combat.x+combat.width/2,cy=combat.y+combat.height/2
    stage.fillStyle(0x000000,0.26).fillEllipse(cx,cy,combat.width*0.96,combat.height*0.90)
    stage.lineStyle(Math.max(1,min*0.002),0xffffff,0.055).strokeEllipse(cx,cy,combat.width*0.91,combat.height*0.82)
    stage.lineStyle(Math.max(2,min*0.0035),ARENA_THEME.colors.player,0.24).lineBetween(combat.x+combat.width*0.07,cy,combat.x+combat.width*0.40,cy)
    stage.lineStyle(Math.max(2,min*0.0035),ARENA_THEME.colors.opponent,0.24).lineBetween(combat.x+combat.width*0.60,cy,combat.x+combat.width*0.93,cy)

    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.player}`))this.keep(this.add.image(combat.x,cy,`asset:${ARENA_ASSETS.vs.player}`).setOrigin(0,0.5).setDisplaySize(Math.min(w*0.32,470),combat.height*0.88).setAlpha(0.07).setDepth(-28))
    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.opponent}`))this.keep(this.add.image(combat.x+combat.width,cy,`asset:${ARENA_ASSETS.vs.opponent}`).setOrigin(1,0.5).setDisplaySize(Math.min(w*0.32,470),combat.height*0.88).setAlpha(0.07).setDepth(-28))
    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.mark}`)){
      const mark=Math.min(combat.width*0.13,combat.height*0.14,92)
      this.keep(this.add.image(cx,cy,`asset:${ARENA_ASSETS.vs.mark}`).setDisplaySize(mark,mark).setAlpha(0.48).setDepth(-4))
    }

    this.asset(ARENA_ASSETS.arenaUi.effectFixture,this.layout.effectLeft,state.localEffects.length?0.62:0.18,-7)
    this.asset(ARENA_ASSETS.arenaUi.effectFixture,this.layout.effectRight,state.opponentEffects.length?0.62:0.18,-7,true)
    this.asset(ARENA_ASSETS.arenaUi.zonXFixture,this.layout.zonXLeft,state.localZonX?0.64:0.16,-7)
    this.asset(ARENA_ASSETS.arenaUi.zonXFixture,this.layout.zonXRight,state.opponentZonX?0.64:0.16,-7,true)
    this.asset(ARENA_ASSETS.arenaUi.pileFixture,this.layout.discard,state.localDiscard?0.50:0.13,-8)
    this.asset(ARENA_ASSETS.arenaUi.pileFixture,this.layout.deck,state.opponentDiscard?0.50:0.13,-8,true)
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
