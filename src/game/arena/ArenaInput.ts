import Phaser from 'phaser'
import type { ArenaRenderState, ArenaLegalAction } from './ArenaStateAdapter'
import type { ArenaLayoutSnapshot } from './ArenaLayout'
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
  constructor(private scene:Phaser.Scene,private dispatch:ArenaDispatch){}
  clear(){for(const item of this.objects){item.plate.destroy();item.label.destroy();item.hit.destroy()}this.objects=[]}

  private plate(src:string,x:number,y:number,w:number,h:number,depth:number,alpha=1){
    const key=`asset:${src}`
    if(this.scene.textures.exists(key))return this.scene.add.image(x+w/2,y+h/2,key).setDisplaySize(w,h).setDepth(depth).setAlpha(alpha)
    const g=this.scene.add.graphics().setDepth(depth)
    g.fillStyle(0x071018,0.92).fillRoundedRect(x,y,w,h,8)
    g.lineStyle(2,0xd7b35a,0.75).strokeRoundedRect(x,y,w,h,8)
    return g
  }

  private commandAsset(action:ArenaLegalAction){
    const label=action.label.toLowerCase()
    if(/serang|attack/.test(label))return ARENA_ASSETS.arenaUi.commandAttack
    if(/zon\s*x|zonx/.test(label))return ARENA_ASSETS.arenaUi.commandZonX
    if(/move|position|posisi|pindah/.test(label))return ARENA_ASSETS.arenaUi.commandMove
    if(/pass|end|tamat/.test(label))return ARENA_ASSETS.arenaUi.commandEnd
    return ARENA_ASSETS.arenaUi.commandSkill
  }

  private addCommand(action:ArenaLegalAction,x:number,y:number,w:number,h:number){
    const plate=this.plate(this.commandAsset(action),x,y,w,h,118,0.98)
    const label=this.scene.add.text(x+w*0.53,y+h/2,action.label.toUpperCase(),{
      fontFamily:'Oxanium, sans-serif',fontSize:`${Math.max(12,Math.min(20,h*0.31))}px`,fontStyle:'bold',color:'#ffffff',stroke:'#02040a',strokeThickness:3,letterSpacing:1.15
    }).setOrigin(0.5).setDepth(120)
    const hit=this.scene.add.zone(x+w/2,y+h/2,w,h).setDepth(121).setInteractive({useHandCursor:true})
    hit.on('pointerover',()=>{(plate as any).setAlpha?.(1);label.setScale(1.035)})
    hit.on('pointerout',()=>{(plate as any).setAlpha?.(0.98);label.setScale(1)})
    hit.on('pointerdown',()=>this.dispatch(action.id))
    this.objects.push({plate,label,hit})
  }

  private addUtility(action:ArenaLegalAction,x:number,y:number,align:'left'|'right'){
    const text=/audio/i.test(action.label)?'AUDIO':'QUIT'
    const w=Math.max(58,Math.min(86,this.scene.scale.width*0.16))
    const h=Math.max(26,Math.min(34,this.scene.scale.height*0.038))
    const left=align==='left'?x:x-w
    const plate=this.plate(ARENA_ASSETS.arenaUi.statusBadge,left,y,w,h,118,0.88)
    const label=this.scene.add.text(left+w/2,y+h/2,text,{fontFamily:'Barlow Condensed, sans-serif',fontSize:`${Math.max(10,h*0.38)}px`,fontStyle:'bold',color:'#eef6fb',letterSpacing:0.9}).setOrigin(0.5).setDepth(120)
    const hit=this.scene.add.zone(left+w/2,y+h/2,w,h).setDepth(121).setInteractive({useHandCursor:true})
    hit.on('pointerdown',()=>this.dispatch(action.id))
    this.objects.push({plate,label,hit})
  }

  render(state:ArenaRenderState,layout:ArenaLayoutSnapshot){
    this.clear()
    const utilities=state.legalActions.filter(action=>/quit|audio/i.test(action.label))
    const actions=state.legalActions.filter(action=>!/quit|audio/i.test(action.label)).slice(0,5)
    const w=this.scene.scale.width,h=this.scene.scale.height

    utilities.forEach(action=>{
      const y=layout.hud.y+Math.max(2,layout.hud.height*0.08)
      if(/quit/i.test(action.label))this.addUtility(action,layout.hud.x+2,y,'left')
      else this.addUtility(action,layout.hud.x+layout.hud.width-2,y,'right')
    })

    if(!actions.length)return

    if(layout.mode==='wide'){
      const buttonW=Math.min(330,Math.max(230,w*0.17))
      const buttonH=Math.min(66,Math.max(52,h*0.058))
      const gap=Math.max(8,h*0.011)
      const x=w-buttonW-Math.max(18,w*0.018)
      const total=actions.length*buttonH+(actions.length-1)*gap
      const startY=Math.max(layout.hud.y+layout.hud.height+24,h*0.5-total*0.43)
      actions.forEach((action,index)=>this.addCommand(action,x,startY+index*(buttonH+gap),buttonW,buttonH))
      return
    }

    const columns=Math.min(2,actions.length)
    const rows=Math.ceil(actions.length/columns)
    const gapX=7,gapY=6
    const availableW=Math.min(layout.prompt.width*0.94,w*0.94)
    const buttonW=(availableW-(columns-1)*gapX)/columns
    const lowerY=layout.prompt.y+layout.prompt.height*0.40
    const availableH=layout.prompt.y+layout.prompt.height-lowerY-2
    const buttonH=Math.max(34,Math.min(48,(availableH-(rows-1)*gapY)/rows))
    const totalW=columns*buttonW+(columns-1)*gapX
    const startX=w/2-totalW/2
    const startY=lowerY
    actions.forEach((action,index)=>{
      const col=index%columns,row=Math.floor(index/columns)
      this.addCommand(action,startX+col*(buttonW+gapX),startY+row*(buttonH+gapY),buttonW,buttonH)
    })
  }
}
