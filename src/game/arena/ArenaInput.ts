import Phaser from 'phaser'
import type { ArenaRenderState, ArenaLegalAction } from './ArenaStateAdapter'
import type { ArenaLayoutSnapshot } from './ArenaLayout'
import { ARENA_THEME } from './arena-theme'

export type ArenaDispatch=(actionId:string)=>void

export function createDomArenaDispatch(shell:HTMLElement):ArenaDispatch{
  return (actionId:string)=>{
    const button=shell.querySelector<HTMLButtonElement>(`[data-arena-action-id="${CSS.escape(actionId)}"]`)
    if(button&&!button.disabled)button.click()
  }
}

type ActionObjects={plate:Phaser.GameObjects.Graphics;label:Phaser.GameObjects.Text;hit:Phaser.GameObjects.Zone}

export class ArenaInput{
  private objects:ActionObjects[]=[]
  constructor(private scene:Phaser.Scene,private dispatch:ArenaDispatch){}
  clear(){for(const item of this.objects){item.plate.destroy();item.label.destroy();item.hit.destroy()}this.objects=[]}

  private addCommand(action:ArenaLegalAction,x:number,y:number,w:number,h:number,accent:number){
    const plate=this.scene.add.graphics().setDepth(118)
    const cut=Math.max(7,h*0.20)
    plate.fillStyle(0x030710,0.94)
    plate.fillPoints([
      new Phaser.Geom.Point(x+cut,y),new Phaser.Geom.Point(x+w,y),new Phaser.Geom.Point(x+w-cut,y+h),new Phaser.Geom.Point(x,y+h),
    ],true)
    plate.lineStyle(Math.max(1.5,h*0.035),accent,0.82).strokePoints([
      new Phaser.Geom.Point(x+cut,y),new Phaser.Geom.Point(x+w,y),new Phaser.Geom.Point(x+w-cut,y+h),new Phaser.Geom.Point(x,y+h),new Phaser.Geom.Point(x+cut,y)
    ])
    const label=this.scene.add.text(x+w/2,y+h/2,action.label.toUpperCase(),{
      fontFamily:'Oxanium, sans-serif',fontSize:`${Math.max(12,Math.min(18,h*0.34))}px`,fontStyle:'bold',color:'#ffffff',stroke:'#02040a',strokeThickness:3,letterSpacing:1.1
    }).setOrigin(0.5).setDepth(120)
    const hit=this.scene.add.zone(x+w/2,y+h/2,w,h).setDepth(121).setInteractive({useHandCursor:true})
    hit.on('pointerover',()=>{plate.setAlpha(1);label.setScale(1.03)})
    hit.on('pointerout',()=>{plate.setAlpha(0.96);label.setScale(1)})
    hit.on('pointerdown',()=>this.dispatch(action.id))
    this.objects.push({plate,label,hit})
  }

  private addUtility(action:ArenaLegalAction,x:number,y:number,align:'left'|'right'){
    const text=/audio/i.test(action.label)?'AUDIO':'QUIT'
    const w=Math.max(48,Math.min(72,this.scene.scale.width*0.145))
    const h=Math.max(24,Math.min(32,this.scene.scale.height*0.035))
    const left=align==='left'?x:x-w
    const accent=text==='QUIT'?ARENA_THEME.colors.opponent:0x95a3b8
    const plate=this.scene.add.graphics().setDepth(118)
    plate.fillStyle(0x02050b,0.82).fillRoundedRect(left,y,w,h,h*0.23)
    plate.lineStyle(1.2,accent,0.52).strokeRoundedRect(left,y,w,h,h*0.23)
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
    const gapX=portrait?6:10
    const gapY=6
    const availableW=Math.min(layout.prompt.width*0.92,portrait?w*0.90:520)
    const buttonW=(availableW-(columns-1)*gapX)/columns
    const lowerY=layout.prompt.y+layout.prompt.height*0.52
    const availableH=layout.prompt.y+layout.prompt.height-lowerY-2
    const buttonH=Math.max(30,Math.min(44,(availableH-(rows-1)*gapY)/rows))
    const totalW=columns*buttonW+(columns-1)*gapX
    const totalH=rows*buttonH+(rows-1)*gapY
    const startX=w/2-totalW/2
    const startY=lowerY+Math.max(0,(availableH-totalH)/2)

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
