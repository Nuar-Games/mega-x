import Phaser from 'phaser'
import type { ArenaRenderState } from './ArenaStateAdapter'

export type ArenaDispatch=(actionId:string)=>void

export function createDomArenaDispatch(shell:HTMLElement):ArenaDispatch{
  return (actionId:string)=>{
    const button=shell.querySelector<HTMLButtonElement>(`[data-arena-action-id="${CSS.escape(actionId)}"]`)
    if(button&&!button.disabled)button.click()
  }
}

export class ArenaInput{
  private labels:Phaser.GameObjects.Text[]=[]
  constructor(private scene:Phaser.Scene,private dispatch:ArenaDispatch){}
  clear(){this.labels.forEach(label=>label.destroy());this.labels=[]}
  render(state:ArenaRenderState){
    this.clear()
    if(!state.legalActions.length)return
    const y=this.scene.scale.height*0.76
    const gap=Math.min(180,this.scene.scale.width/Math.max(2,state.legalActions.length))
    const start=this.scene.scale.width/2-((state.legalActions.length-1)*gap)/2
    state.legalActions.slice(0,4).forEach((action,index)=>{
      const label=this.scene.add.text(start+index*gap,y,action.label,{fontFamily:'Arial Narrow, Arial, sans-serif',fontSize:`${Math.max(14,this.scene.scale.width*0.032)}px`,fontStyle:'bold',color:'#ffffff',stroke:'#000000',strokeThickness:4}).setOrigin(0.5).setDepth(120).setInteractive({useHandCursor:true})
      label.on('pointerdown',()=>this.dispatch(action.id))
      this.labels.push(label)
    })
  }
}
