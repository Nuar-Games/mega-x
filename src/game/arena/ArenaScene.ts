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
    this.cards=new ArenaCards(this,dispatch,card=>this.inspectLayer.show(card,action=>dispatch(action.id)))
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
    const w=this.scale.width,h=this.scale.height
    if(this.textures.exists(`asset:${ARENA_ASSETS.background}`))this.backdrop=this.add.image(w/2,h/2,`asset:${ARENA_ASSETS.background}`).setDisplaySize(w,h).setAlpha(0.90).setDepth(-40)

    const combat=this.layout.combat
    const cx=combat.x+combat.width/2,cy=combat.y+combat.height/2
    const wash=this.keep(this.add.graphics().setDepth(-34))
    wash.fillStyle(0x01030a,0.18).fillRect(0,0,w,h)
    wash.fillStyle(ARENA_THEME.colors.player,0.08).fillCircle(combat.x+combat.width*0.17,cy,Math.max(w,h)*0.42)
    wash.fillStyle(ARENA_THEME.colors.opponent,0.08).fillCircle(combat.x+combat.width*0.83,cy,Math.max(w,h)*0.42)

    const fieldSlots=5
    const slotAspect=360/500
    const desiredSlotH=Math.min(combat.height*0.68,310)
    const clashGap=Math.max(28,combat.width*0.055)
    const wideSpreadFactor=3.56
    const maxSlotW=Math.max(28,(combat.width*0.96-clashGap*2)/wideSpreadFactor)
    const slotW=Math.min(desiredSlotH*slotAspect,maxSlotW)
    const slotH=slotW/slotAspect
    const slotY=cy-slotH/2
    const innerOffset=clashGap+slotW/2
    const outerOffset=innerOffset+slotW*0.78
    const slotRegions:ArenaRect[]=[
      {x:cx-outerOffset-slotW/2,y:slotY,width:slotW,height:slotH},
      {x:cx-innerOffset-slotW/2,y:slotY,width:slotW,height:slotH},
      {x:cx-slotW/2,y:slotY,width:slotW,height:slotH},
      {x:cx+innerOffset-slotW/2,y:slotY,width:slotW,height:slotH},
      {x:cx+outerOffset-slotW/2,y:slotY,width:slotW,height:slotH},
    ]
    const fieldFrames=[
      ARENA_ASSETS.arenaUi.fieldBlue,
      ARENA_ASSETS.arenaUi.fieldBlue,
      ARENA_ASSETS.arenaUi.fieldNeutral,
      ARENA_ASSETS.arenaUi.fieldRed,
      ARENA_ASSETS.arenaUi.fieldRed,
    ]
    fieldFrames.slice(0,fieldSlots).forEach((src,index)=>this.asset(src,slotRegions[index],index===2?0.74:0.92,-18,index>2))

    const field=this.keep(this.add.graphics().setDepth(-19))
    field.lineStyle(Math.max(1,slotW*0.012),0xe0c26c,0.12)
    field.lineBetween(cx-slotW*0.18,cy,cx+slotW*0.18,cy)
    field.lineStyle(Math.max(2,slotW*0.018),ARENA_THEME.colors.player,0.12)
    field.lineBetween(slotRegions[0].x+slotW*0.25,cy,slotRegions[1].x+slotW*0.75,cy)
    field.lineStyle(Math.max(2,slotW*0.018),ARENA_THEME.colors.opponent,0.12)
    field.lineBetween(slotRegions[3].x+slotW*0.25,cy,slotRegions[4].x+slotW*0.75,cy)

    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.mark}`)){
      const mark=Math.min(combat.width*0.12,combat.height*0.20,124)
      this.keep(this.add.image(cx,cy,`asset:${ARENA_ASSETS.vs.mark}`).setDisplaySize(mark,mark).setAlpha(0.98).setDepth(-4))
    }

    const localFixtureAlpha=0.82
    const opponentFixtureAlpha=0.82
    this.asset(ARENA_ASSETS.arenaUi.fieldNeutral,this.layout.effectLeft,state.localEffects.length?0.76:0.18,-7)
    this.asset(ARENA_ASSETS.arenaUi.fieldNeutral,this.layout.effectRight,state.opponentEffects.length?0.76:0.18,-7,true)
    this.asset(ARENA_ASSETS.arenaUi.zonXFixture,this.layout.zonXLeft,state.localZonX?0.98:localFixtureAlpha,-7)
    this.asset(ARENA_ASSETS.arenaUi.zonXFixture,this.layout.zonXRight,state.opponentZonX?0.98:opponentFixtureAlpha,-7,true)
    this.asset(ARENA_ASSETS.arenaUi.discardFixture,this.layout.discard,state.localDiscard?0.96:0.72,-8)
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
