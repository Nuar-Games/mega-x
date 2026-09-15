import Phaser from 'phaser'
import { ARENA_ASSETS } from './ArenaAssets'
import { computeArenaLayout, type ArenaLayoutSnapshot } from './ArenaLayout'
import { readArenaRenderState, type ArenaRenderState } from './ArenaStateAdapter'
import { ArenaCards } from './ArenaCards'
import { ArenaHud } from './ArenaHud'
import { ArenaEffects } from './ArenaEffects'
import { ArenaInput, createDomArenaDispatch } from './ArenaInput'
import { ArenaAudio } from './ArenaAudio'
import { ARENA_THEME } from './arena-theme'

export class ArenaScene extends Phaser.Scene{
  private shell:HTMLElement
  private cards!:ArenaCards
  private hud!:ArenaHud
  private effects!:ArenaEffects
  private inputLayer!:ArenaInput
  private audioLayer=new ArenaAudio()
  private previous:ArenaRenderState|null=null
  private layout!:ArenaLayoutSnapshot
  private backdrop?:Phaser.GameObjects.Image
  private rails:Phaser.GameObjects.GameObject[]=[]

  constructor(shell:HTMLElement){super('MegaXCleanArena');this.shell=shell}

  preload(){
    this.load.image(`asset:${ARENA_ASSETS.background}`,ARENA_ASSETS.background)
    this.load.image(`asset:${ARENA_ASSETS.vs.mark}`,ARENA_ASSETS.vs.mark)
    this.load.image(`asset:${ARENA_ASSETS.vs.player}`,ARENA_ASSETS.vs.player)
    this.load.image(`asset:${ARENA_ASSETS.vs.opponent}`,ARENA_ASSETS.vs.opponent)
    this.load.image(`asset:${ARENA_ASSETS.cards.backGame}`,ARENA_ASSETS.cards.backGame)
    ARENA_ASSETS.cards.game.forEach(src=>this.load.image(`asset:${src}`,src))
  }

  create(){
    this.cards=new ArenaCards(this)
    this.hud=new ArenaHud(this)
    this.effects=new ArenaEffects(this)
    this.inputLayer=new ArenaInput(this,createDomArenaDispatch(this.shell))
    this.scale.on('resize',()=>this.renderArena(true))
    this.renderArena(true)
  }

  private drawArenaFrame(){
    this.rails.forEach(r=>r.destroy());this.rails=[]
    this.backdrop?.destroy()
    if(this.textures.exists(`asset:${ARENA_ASSETS.background}`)){
      this.backdrop=this.add.image(this.scale.width/2,this.scale.height/2,`asset:${ARENA_ASSETS.background}`).setDisplaySize(this.scale.width,this.scale.height).setAlpha(0.42).setDepth(-20)
    }
    const g=this.add.graphics().setDepth(-10)
    g.fillStyle(ARENA_THEME.colors.background,0.72).fillRect(0,0,this.scale.width,this.scale.height)
    g.lineStyle(Math.max(1,Math.min(this.scale.width,this.scale.height)*0.002),ARENA_THEME.colors.player,0.35)
    g.strokeRoundedRect(this.layout.combat.x,this.layout.combat.y,this.layout.combat.width,this.layout.combat.height,18)
    g.lineStyle(Math.max(1,Math.min(this.scale.width,this.scale.height)*0.0015),ARENA_THEME.colors.opponent,0.22)
    g.strokeLineShape(new Phaser.Geom.Line(this.layout.combat.x,this.layout.combat.y+this.layout.combat.height*0.5,this.layout.combat.x+this.layout.combat.width,this.layout.combat.y+this.layout.combat.height*0.5))
    this.rails.push(g)
    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.player}`))this.rails.push(this.add.image(0,this.layout.combat.y+this.layout.combat.height/2,`asset:${ARENA_ASSETS.vs.player}`).setOrigin(0,0.5).setDisplaySize(Math.min(this.scale.width*0.36,520),this.layout.combat.height*0.9).setAlpha(0.10).setDepth(-15))
    if(this.textures.exists(`asset:${ARENA_ASSETS.vs.opponent}`))this.rails.push(this.add.image(this.scale.width,this.layout.combat.y+this.layout.combat.height/2,`asset:${ARENA_ASSETS.vs.opponent}`).setOrigin(1,0.5).setDisplaySize(Math.min(this.scale.width*0.36,520),this.layout.combat.height*0.9).setAlpha(0.10).setDepth(-15))
  }

  public renderArena(force=false){
    if(!this.cards)return
    this.layout=computeArenaLayout(this.scale.width,this.scale.height)
    const next=readArenaRenderState(this.shell)
    if(force)this.drawArenaFrame()
    this.cards.render(next,this.layout)
    this.hud.render(next,this.layout)
    this.inputLayer.render(next)
    this.effects.transition(this.previous,next)
    this.audioLayer.sync(next)
    this.previous=next
  }
}
