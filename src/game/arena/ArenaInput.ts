import Phaser from 'phaser'
import type { ArenaRenderState, ArenaLegalAction } from './ArenaStateAdapter'
import type { ArenaLayoutSnapshot } from './ArenaLayout'
import { ARENA_THEME } from './arena-theme'
import { ARENA_ASSETS } from './ArenaAssets'

export type ArenaDispatch=(actionId:string)=>void

export function createDomArenaDispatch(shell:HTMLElement):ArenaDispatch{
  return (actionId:string)=>{
    const button=shell.querySelector<HTMLButtonElement>(`[data-arena-action-id="${CSS.escape(actionId)}"]`)
    if(button&&!button.disabled)button.click()
  }
}

type ActionObjects={plate:Phaser.GameObjects.GameObject;label:Phaser.GameObjects.Text;hit:Phaser.GameObjects.Zone}

export class ArenaInput{
  private objects:ActionObjects[]=[]
  private tray?:Phaser.GameObjects.Image
  constructor(private scene:Phaser.Scene,private dispatch:ArenaDispatch){}
  clear(){for(const item of this.objects){item.plate.destroy();item.label.destroy();item.hit.destroy()}this.objects=[];this.tray?.destroy();this.tray=undefined}

  private plate(src:string,x:number,y:number,w:number,h:number,depth:number,alpha=1){
    const key=`asset:${src}`
    if(this.scene.textures.exists(key))return this.scene.add.image(x+w/2,y+h/2,key).setDisplaySize(w,h).setDepth(depth).setAlpha(alpha)
    const g=this.scene.add.graphics().setDepth(depth)
    g.lineStyle(2,0xd7b35a,0.55).lineBetween(x,y+h/2,x+w,y+h/2)
    return g
  }

  private addCommand(action:ArenaLegalAction,x:number,y:number,w:number,h:number,accent:number){
    const plate=this.plate(ARENA_ASSETS.arenaUi.commandControl,x,y,w,h,118,0.96)
    if('setTint' in plate && typeof (plate as Phaser.GameObjects.Image).setTint==='function') (plate as Phaser.GameObjects.Image).setTint(accent)
    const label=this.scene.add.text(x+w/2,y+h/2,action.label.toUpperCase(),{
      fontFamily:'Oxanium, sans-serif',fontSize:`${Math.max(12,Math.min(18,h*0.34))}px`,fontStyle:'bold',color:'#ffffff',stroke:'#02040a',strokeThickness:3,letterSpacing:1.1
    }).setOrigin(0.5).setDepth(120)
    const hit=this.scene.add.zone(x+w/2,y+h/2,w,h).setDepth(121).setInteractive({useHandCursor:true})
    hit.on('pointerover',()=>{(plate as any).setAlpha?.(1);label.setScale(1.035)})
    hit.on('pointerout',()=>{(plate as any).setAlpha?.(0.96);label.setScale(1)})
    hit.on('pointerdown',()=>this.dispatch(action.id))
    this.objects.push({plate,label,hit})
  }

  private addUtility(action:ArenaLegalAction,x:number,y:number,align:'left'|'right'){
    const text=/audio/i.test(action.label)?'AUDIO':'QUIT'
    const w=Math.max(52,Math.min(78,this.scene.scale.width*0.15))
    const h=Math.max(24,Math.min(32,this.scene.scale.height*0.035))
    const left=align==='left'?x:x-w
    const accent=text==='QUIT'?ARENA_THEME.colors.opponent:0x95a3b8
    const plate=this.plate(ARENA_ASSETS.arenaUi.commandControl,left,y,w,h,118,0.72)
    if('setTint' in plate && typeof (plate as Phaser.GameObjects.Image).setTint==='function') (plate as Phaser.GameObjects.Image).setTint(accent)
    const label=this.scene.add.text(left+w/2,y+h/2,text,{fontFamily:'Barlow Condensed, sans-serif',fontSize:`${Math.max(10,h*0.38)}px`,fontStyle:'bold',color:'#dfe5ee',letterSpacing:0.9}).setOrigin(0.5).setDepth(120)
    const hit=this.scene.add.zone(left+w/2,y+h/2,w,h).setDepth(121).setInteractive({useHandCursor:true})
    hit.on('pointerdown',()=>this.dispatch(action.id))
    this.objects.push({plate,label,hit})
  }

  render(state:ArenaRenderState,layout:ArenaLayoutSnapshot){
    this.clear()
    const utilities=state.legalActions.filter(action=>/quit|audio/i.test(action.label))
    const actions=state.legalActions.filter(action=>!/quit|audio/i.test(action.label)).slice(0,4)
    const w=this.scene.scale.width

    utilities.forEach(action=>{
      const y=layout.hud.y+Math.max(2,layout.hud.height*0.08)
      if(/quit/i.test(action.label))this.addUtility(action,layout.hud.x+2,y,'left')
      else this.addUtility(action,layout.hud.x+layout.hud.width-2,y,'right')
    })

    if(!actions.length)return
    const portrait=layout.mode==='portrait'
    const columns=Math.min(2,actions.length)
    const rows=Math.ceil(actions.length/columns)
    const gapX=portrait?7:11
    const gapY=6
    const availableW=Math.min(layout.prompt.width*0.92,portrait?w*0.91:560)
    const buttonW=(availableW-(columns-1)*gapX)/columns
    const lowerY=layout.prompt.y+layout.prompt.height*0.47
    const availableH=layout.prompt.y+layout.prompt.height-lowerY-2
    const buttonH=Math.max(32,Math.min(46,(availableH-(rows-1)*gapY)/rows))
    const totalW=columns*buttonW+(columns-1)*gapX
    const totalH=rows*buttonH+(rows-1)*gapY
    const startX=w/2-totalW/2
    const startY=lowerY+Math.max(0,(availableH-totalH)/2)

    if(portrait){
      const key=`asset:${ARENA_ASSETS.arenaUi.mobileCommandTray}`
      if(this.scene.textures.exists(key))this.tray=this.scene.add.image(w/2,startY+totalH/2,key).setDisplaySize(Math.min(w*0.96,totalW+28),totalH+18).setDepth(116).setAlpha(0.68)
    }

    actions.forEach((action,index)=>{
      const col=index%columns
      const row=Math.floor(index/columns)
      const x=startX+col*(buttonW+gapX)
      const y=startY+row*(buttonH+gapY)
      const accent=/serang|attack/i.test(action.label)?ARENA_THEME.colors.opponent:/pass|tamat|end/i.test(action.label)?0xd7b35a:ARENA_THEME.colors.player
      this.addCommand(action,x,y,buttonW,buttonH,accent)
    })
  }
}
