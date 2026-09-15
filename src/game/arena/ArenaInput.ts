import Phaser from 'phaser'
import type { ArenaRenderState, ArenaLegalAction } from './ArenaStateAdapter'
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
    const cut=Math.max(8,h*0.22)
    plate.fillStyle(0x040812,0.92)
    plate.fillPoints([
      new Phaser.Geom.Point(x+cut,y),new Phaser.Geom.Point(x+w,y),new Phaser.Geom.Point(x+w-cut,y+h),new Phaser.Geom.Point(x,y+h),
    ],true)
    plate.lineStyle(2,accent,0.82).strokePoints([
      new Phaser.Geom.Point(x+cut,y),new Phaser.Geom.Point(x+w,y),new Phaser.Geom.Point(x+w-cut,y+h),new Phaser.Geom.Point(x,y+h),new Phaser.Geom.Point(x+cut,y)
    ])
    plate.fillStyle(accent,0.9).fillRect(x+6,y+h-4,Math.max(22,w*0.22),2)
    const label=this.scene.add.text(x+w/2,y+h/2,action.label.toUpperCase(),{
      fontFamily:'Oxanium, sans-serif',fontSize:`${Math.max(13,Math.min(21,h*0.34))}px`,fontStyle:'bold',color:'#ffffff',stroke:'#02040a',strokeThickness:3,letterSpacing:1.2
    }).setOrigin(0.5).setDepth(120)
    const hit=this.scene.add.zone(x+w/2,y+h/2,w,h).setDepth(121).setInteractive({useHandCursor:true})
    hit.on('pointerover',()=>{plate.setAlpha(1);label.setScale(1.03)})
    hit.on('pointerout',()=>{plate.setAlpha(0.94);label.setScale(1)})
    hit.on('pointerdown',()=>this.dispatch(action.id))
    this.objects.push({plate,label,hit})
  }

  private addUtility(action:ArenaLegalAction,x:number,y:number,align:'left'|'right'){
    const text=/audio/i.test(action.label)?'AUDIO':'QUIT'
    const w=Math.max(56,Math.min(88,this.scene.scale.width*0.16))
    const h=Math.max(28,Math.min(38,this.scene.scale.height*0.04))
    const left=align==='left'?x:x-w
    const accent=text==='QUIT'?ARENA_THEME.colors.opponent:0x95a3b8
    const plate=this.scene.add.graphics().setDepth(118)
    plate.fillStyle(0x02050b,0.72).fillRoundedRect(left,y,w,h,h*0.25)
    plate.lineStyle(1.5,accent,0.48).strokeRoundedRect(left,y,w,h,h*0.25)
    const label=this.scene.add.text(left+w/2,y+h/2,text,{fontFamily:'Barlow Condensed, sans-serif',fontSize:`${Math.max(11,h*0.38)}px`,fontStyle:'bold',color:'#dfe5ee',letterSpacing:1}).setOrigin(0.5).setDepth(120)
    const hit=this.scene.add.zone(left+w/2,y+h/2,w,h).setDepth(121).setInteractive({useHandCursor:true})
    hit.on('pointerdown',()=>this.dispatch(action.id))
    this.objects.push({plate,label,hit})
  }

  render(state:ArenaRenderState){
    this.clear()
    const utilities=state.legalActions.filter(action=>/quit|audio/i.test(action.label))
    const actions=state.legalActions.filter(action=>!/quit|audio/i.test(action.label)).slice(0,4)
    const w=this.scene.scale.width
    const h=this.scene.scale.height

    utilities.forEach(action=>{
      if(/quit/i.test(action.label))this.addUtility(action,Math.max(10,w*0.025),Math.max(10,h*0.018),'left')
      else this.addUtility(action,w-Math.max(10,w*0.025),Math.max(10,h*0.018),'right')
    })

    if(!actions.length)return
    const portrait=h/w>=1.15
    const buttonW=Math.min(portrait?w*0.38:190,(w*0.88-(actions.length-1)*10)/Math.max(1,Math.min(actions.length,2)))
    const buttonH=Math.max(38,Math.min(60,h*0.058))
    const columns=Math.min(2,actions.length)
    const rows=Math.ceil(actions.length/columns)
    const gapX=10
    const gapY=8
    const totalW=columns*buttonW+(columns-1)*gapX
    const totalH=rows*buttonH+(rows-1)*gapY
    const startX=w/2-totalW/2
    const startY=h-Math.max(18,h*0.025)-totalH

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
