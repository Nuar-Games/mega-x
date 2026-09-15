import Phaser from 'phaser'
import { ARENA_ASSETS } from './ArenaAssets'
import { computeArenaLayout, type ArenaLayoutSnapshot } from './ArenaLayout'
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
  private rails:Phaser.GameObjects.GameObject[]=[]
  constructor(shell:HTMLElement){super('MegaXCleanArena');this.shell=shell}
  preload(){
    this.texturePool=new ArenaTexturePool(this,()=>this.renderArena())
    this.load.image(`asset:${ARENA_ASSETS.background}`,ARENA_ASSETS.background)
    this.load.image(`asset:${ARENA_ASSETS.vs.mark}`,ARENA_ASSETS.vs.mark)
    this.load.image(`asset:${ARENA_ASSETS.vs.player}`,ARENA_ASSETS.vs.player)
    this.load.image(`asset:${ARENA_ASSETS.vs.opponent}`,ARENA_ASSETS.vs.opponent)
    this.load.image(`asset:${ARENA_ASSETS.cards.backGame}`,ARENA_ASSETS.cards.backGame)
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
  }
  private drawArenaFrame(){
    this.rails.forEach(r=>r.destroy());this.rails=[];this.backdrop?.destroy()
    const w=this.scale.width,h=this.scale.height,min=Math.min(w,h)
    if(this.textures.exists(`asset:${ARENA_ASSETS.background}`))this.backdrop=this.add.image(w/2,h/2,`asset:${ARENA_ASSETS.background}`).setDisplaySize(w,h).setAlpha(0.56).setDepth(-40)
    const wash=this.add.graphics().setDepth(-35)
    wash.fillStyle(0x01040a,0.66).fillRect(0,0,w,h)
    wash.fillStyle(ARENA_THEME.colors.player,0.07).fillTriangle(0,h,0,h*0.26,w*0.46,h)
    wash.fillStyle(ARENA_THEME.colors.opponent,0.07).fillTriangle(w,0,w,h*0.74,w*0.54,0)
    this.rails.push(wash)
    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.player}`))this.rails.push(this.add.image(0,this.layout.combat.y+this.layout.combat.height*0.56,`asset:${ARENA_ASSETS.vs.player}`).setOrigin(0,0.5).setDisplaySize(Math.min(w*0.42,620),this.layout.combat.height*0.98).setAlpha(0.12).setDepth(-30))
    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.opponent}`))this.rails.push(this.add.image(w,this.layout.combat.y+this.layout.combat.height*0.44,`asset:${ARENA_ASSETS.vs.opponent}`).setOrigin(1,0.5).setDisplaySize(Math.min(w*0.42,620),this.layout.combat.height*0.98).setAlpha(0.12).setDepth(-30))
    const stage=this.add.graphics().setDepth(-20),c=this.layout.combat,bevel=Math.max(10,min*0.018)
    const pts=[new Phaser.Geom.Point(c.x+bevel,c.y),new Phaser.Geom.Point(c.x+c.width-bevel,c.y),new Phaser.Geom.Point(c.x+c.width,c.y+bevel),new Phaser.Geom.Point(c.x+c.width,c.y+c.height-bevel),new Phaser.Geom.Point(c.x+c.width-bevel,c.y+c.height),new Phaser.Geom.Point(c.x+bevel,c.y+c.height),new Phaser.Geom.Point(c.x,c.y+c.height-bevel),new Phaser.Geom.Point(c.x,c.y+bevel)]
    stage.fillStyle(0x030710,0.72).fillPoints(pts,true);stage.lineStyle(Math.max(1.5,min*0.0025),0xffffff,0.08).strokePoints([...pts,pts[0]])
    const midX=c.x+c.width/2
    stage.lineStyle(Math.max(2,min*0.004),ARENA_THEME.colors.player,0.36).lineBetween(c.x+bevel,c.y+c.height*0.5,midX-bevel,c.y+c.height*0.5)
    stage.lineStyle(Math.max(2,min*0.004),ARENA_THEME.colors.opponent,0.36).lineBetween(midX+bevel,c.y+c.height*0.5,c.x+c.width-bevel,c.y+c.height*0.5)
    stage.fillStyle(0xffffff,0.06).fillCircle(midX,c.y+c.height*0.5,Math.max(22,min*0.055));stage.lineStyle(Math.max(1,min*0.002),0xd7b35a,0.42).strokeCircle(midX,c.y+c.height*0.5,Math.max(22,min*0.055));this.rails.push(stage)
    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.mark}`)){const mark=Math.min(c.width*0.18,c.height*0.18,120);this.rails.push(this.add.image(midX,c.y+c.height*0.5,`asset:${ARENA_ASSETS.vs.mark}`).setDisplaySize(mark,mark).setAlpha(0.78).setDepth(-5))}
  }
  public renderArena(force=false){
    if(!this.cards)return
    this.layout=computeArenaLayout(this.scale.width,this.scale.height)
    const next=readArenaRenderState(this.shell)
    this.texturePool.ensureState(next)
    if(force)this.drawArenaFrame()
    this.cards.render(next,this.layout);this.hud.render(next,this.layout);this.inputLayer.render(next);this.tieBreaker.render(next)
    this.effects.transition(this.previous,next);this.audioLayer.sync(next);this.previous=next
  }
}
